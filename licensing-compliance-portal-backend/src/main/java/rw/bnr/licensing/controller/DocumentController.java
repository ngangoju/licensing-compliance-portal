package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import rw.bnr.licensing.domain.entity.ApplicationDocument;
import rw.bnr.licensing.dto.application.ApplicationDocumentResponse;
import rw.bnr.licensing.security.PortalUserPrincipal;
import rw.bnr.licensing.service.DocumentService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications/{applicationId}/documents")
@Tag(name = "Documents", description = "Application document endpoints")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    @Operation(summary = "List documents attached to an application")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public List<ApplicationDocumentResponse> listDocuments(
            @PathVariable UUID applicationId,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        return documentService.listDocuments(applicationId, principal);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document for an application")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('APPLICANT', 'ADMIN', 'INSPECTION_OFFICER')")
    public ApplicationDocumentResponse uploadDocument(
            @PathVariable UUID applicationId,
            @RequestParam("documentType") String documentType,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal PortalUserPrincipal principal,
            HttpServletRequest request
    ) {
        return documentService.uploadDocument(
                applicationId,
                documentType,
                file,
                principal,
                request.getRemoteAddr(),
                request.getHeader(HttpHeaders.USER_AGENT)
        );
    }

    @GetMapping("/{documentId}/download")
    @Operation(summary = "Download the current content of a stored document")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable UUID applicationId,
            @PathVariable UUID documentId,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        Resource resource = documentService.loadDocumentContent(applicationId, documentId, principal);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping(value = "/{documentId}/view", produces = {MediaType.APPLICATION_PDF_VALUE, MediaType.IMAGE_JPEG_VALUE, MediaType.IMAGE_PNG_VALUE, MediaType.ALL_VALUE})
    @Operation(summary = "View the document content inline (for preview)")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> viewDocument(
            @PathVariable UUID applicationId,
            @PathVariable UUID documentId,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        var document = documentService.loadDocumentForView(applicationId, documentId, principal);
        Resource resource = documentService.loadDocumentContent(applicationId, documentId, principal);

        String contentType = document.getMimeType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(document.getFileSizeBytes())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + document.getOriginalName() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "private, max-age=3600")
                .body(resource);
    }

    @GetMapping("/{documentId}/history")
    @Operation(summary = "Get version history for a document type")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public List<ApplicationDocumentResponse> getDocumentHistory(
            @PathVariable UUID applicationId,
            @PathVariable UUID documentId,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        return documentService.getDocumentHistory(applicationId, documentId, principal);
    }
}
