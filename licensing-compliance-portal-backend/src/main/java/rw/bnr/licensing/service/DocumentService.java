package rw.bnr.licensing.service;

import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.entity.ApplicationDocument;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.domain.repository.ApplicationDocumentRepository;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.dto.application.ApplicationDocumentResponse;
import rw.bnr.licensing.exception.FileValidationException;
import rw.bnr.licensing.exception.NotFoundException;
import rw.bnr.licensing.security.PortalUserPrincipal;
import rw.bnr.licensing.service.query.ApplicationAccessService;
import rw.bnr.licensing.service.query.ApplicationQueryService;
import rw.bnr.licensing.service.storage.FileStorageService;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DocumentService {

    private static final int MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/png",
            "image/jpeg",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
    );

    private final ApplicationDocumentRepository documentRepository;
    private final ApplicationQueryService applicationQueryService;
    private final ApplicationAccessService applicationAccessService;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    public DocumentService(
            ApplicationDocumentRepository documentRepository,
            ApplicationQueryService applicationQueryService,
            ApplicationAccessService applicationAccessService,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            AuditService auditService
    ) {
        this.documentRepository = documentRepository;
        this.applicationQueryService = applicationQueryService;
        this.applicationAccessService = applicationAccessService;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.auditService = auditService;
    }

    public List<ApplicationDocumentResponse> listDocuments(UUID applicationId, PortalUserPrincipal principal) {
        Application application = applicationQueryService.loadAccessibleApplication(applicationId, principal);
        return mapDocuments(documentRepository.findByApplicationIdOrderByDocumentTypeAscVersionDesc(application.getId()));
    }

    public List<ApplicationDocumentResponse> getDocumentHistory(UUID applicationId, UUID documentId, PortalUserPrincipal principal) {
        ApplicationDocument document = loadDocument(applicationId, documentId, principal);
        return mapDocuments(documentRepository.findByApplicationIdAndDocumentTypeOrderByVersionDesc(applicationId, document.getDocumentType()));
    }

    public ApplicationDocument loadDocumentForView(UUID applicationId, UUID documentId, PortalUserPrincipal principal) {
        return loadDocument(applicationId, documentId, principal);
    }

    public Resource loadDocumentContent(UUID applicationId, UUID documentId, PortalUserPrincipal principal) {
        ApplicationDocument document = loadDocument(applicationId, documentId, principal);
        return fileStorageService.loadAsResource(document.getStoredPath());
    }

    @Transactional
    public ApplicationDocumentResponse uploadDocument(
            UUID applicationId,
            String documentType,
            MultipartFile file,
            PortalUserPrincipal principal,
            String ipAddress,
            String userAgent
    ) {
        validateDocumentType(documentType);
        validateFile(file);

        Application application = applicationQueryService.loadAccessibleApplication(applicationId, principal);
        applicationAccessService.assertCanUpload(application, principal);
        User actor = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("Authenticated user could not be loaded."));

        ApplicationDocument current = documentRepository
                .findFirstByApplicationIdAndDocumentTypeAndCurrentTrue(applicationId, documentType)
                .orElse(null);

        int version = current == null ? 1 : current.getVersion() + 1;
        if (current != null) {
            current.setCurrent(false);
            documentRepository.save(current);
        }

        String storedPath = fileStorageService.store(applicationId, documentType, version, file);

        String mimeType = file.getContentType();
        String originalFilename = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        
        // If mime type is generic or missing, try to detect from extension
        if (mimeType == null || mimeType.equals("application/octet-stream") || mimeType.equals("text/plain")) {
            if (originalFilename.toLowerCase().endsWith(".pdf")) {
                mimeType = "application/pdf";
            } else if (originalFilename.toLowerCase().endsWith(".png")) {
                mimeType = "image/png";
            } else if (originalFilename.toLowerCase().endsWith(".jpg") || originalFilename.toLowerCase().endsWith(".jpeg")) {
                mimeType = "image/jpeg";
            } else if (originalFilename.toLowerCase().endsWith(".docx")) {
                mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            }
        }

        ApplicationDocument document = new ApplicationDocument();
        document.setApplication(application);
        document.setDocumentType(documentType.trim().toUpperCase(Locale.ROOT));
        document.setOriginalName(originalFilename);
        document.setStoredPath(storedPath);
        document.setMimeType(mimeType == null ? "application/octet-stream" : mimeType);
        document.setFileSizeBytes(Math.toIntExact(file.getSize()));
        document.setVersion(version);
        document.setCurrent(true);
        document.setUploadedBy(actor);
        document.setUploadStage(application.getStatus());
        ApplicationDocument saved = documentRepository.save(document);

        auditService.record(
                applicationId,
                principal,
                current == null ? AuditAction.DOCUMENT_UPLOADED : AuditAction.DOCUMENT_VERSION_ADDED,
                "Uploaded " + saved.getDocumentType() + " version " + saved.getVersion(),
                null,
                """
                {"documentType":"%s","version":%d}
                """.formatted(saved.getDocumentType(), saved.getVersion()).trim(),
                ipAddress,
                userAgent
        );

        return toResponse(saved);
    }

    private void validateDocumentType(String documentType) {
        if (documentType == null || documentType.isBlank()) {
            throw new FileValidationException("Document type is required.");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("A non-empty file is required.");
        }
        if (file.getSize() > MAX_UPLOAD_BYTES) {
            throw new FileValidationException("Uploaded file exceeds the 5 MB limit.");
        }
        String mimeType = file.getContentType();
        if (mimeType == null || !ALLOWED_MIME_TYPES.contains(mimeType)) {
            throw new FileValidationException("Uploaded file type is not supported.");
        }
    }

    private ApplicationDocument loadDocument(UUID applicationId, UUID documentId, PortalUserPrincipal principal) {
        applicationQueryService.loadAccessibleApplication(applicationId, principal);
        return documentRepository.findByIdAndApplicationId(documentId, applicationId)
                .orElseThrow(() -> new NotFoundException("Document was not found."));
    }

    private List<ApplicationDocumentResponse> mapDocuments(List<ApplicationDocument> documents) {
        Map<UUID, User> uploaders = userRepository.findAllById(documents.stream()
                        .map(document -> document.getUploadedBy().getId())
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return documents.stream().map(document -> new ApplicationDocumentResponse(
                document.getId(),
                document.getDocumentType(),
                document.getOriginalName(),
                document.getMimeType(),
                document.getFileSizeBytes(),
                document.getVersion(),
                document.isCurrent(),
                document.getUploadStage(),
                uploaders.containsKey(document.getUploadedBy().getId())
                        ? uploaders.get(document.getUploadedBy().getId()).getFullName()
                        : null,
                document.getCreatedAt()
        )).toList();
    }

    private ApplicationDocumentResponse toResponse(ApplicationDocument document) {
        return new ApplicationDocumentResponse(
                document.getId(),
                document.getDocumentType(),
                document.getOriginalName(),
                document.getMimeType(),
                document.getFileSizeBytes(),
                document.getVersion(),
                document.isCurrent(),
                document.getUploadStage(),
                document.getUploadedBy().getFullName(),
                document.getCreatedAt()
        );
    }
}
