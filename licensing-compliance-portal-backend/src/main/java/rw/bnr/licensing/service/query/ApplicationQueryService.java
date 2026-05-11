package rw.bnr.licensing.service.query;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.entity.AuditEntry;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.repository.ApplicationRepository;
import rw.bnr.licensing.domain.repository.AuditEntryRepository;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.dto.application.ApplicationDetailResponse;
import rw.bnr.licensing.dto.audit.AuditEntryResponse;
import rw.bnr.licensing.exception.NotFoundException;
import rw.bnr.licensing.security.PortalUserPrincipal;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ApplicationQueryService {

    private final ApplicationRepository applicationRepository;
    private final AuditEntryRepository auditEntryRepository;
    private final UserRepository userRepository;
    private final ApplicationAccessService accessService;

    public ApplicationQueryService(
            ApplicationRepository applicationRepository,
            AuditEntryRepository auditEntryRepository,
            UserRepository userRepository,
            ApplicationAccessService accessService
    ) {
        this.applicationRepository = applicationRepository;
        this.auditEntryRepository = auditEntryRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
    }

    public ApplicationDetailResponse getApplication(UUID applicationId, PortalUserPrincipal principal) {
        Application application = loadAccessibleApplication(applicationId, principal);
        return new ApplicationDetailResponse(
                application.getId(),
                application.getReferenceNumber(),
                application.getLicenseType(),
                application.getInstitutionName(),
                application.getProposedName(),
                application.getStatus(),
                application.getProposedCapitalRwf(),
                application.getRegisteredCountry(),
                application.isForeignInstitution(),
                application.getHomeSupervisorName(),
                application.getHomeSupervisorEmail(),
                application.getApplicant().getFullName(),
                application.getApplicant().getEmail(),
                application.getSubmittedAt(),
                application.getLicenseNumber(),
                application.getLicenseIssuedAt(),
                application.getSlaWorkingDaysTarget(),
                application.getSlaWorkingDaysUsed(),
                application.getSlaClockStartedAt(),
                application.getSlaClockPausedAt(),
                application.getSlaPausedReason(),

                application.getTechnicalReviewNotes(),
                application.getLegalReviewNotes(),
                application.getRejectionReason(),
                application.getAipGrantedAt(),
                application.getAipExpiresAt(),
                application.getOrganizationDeadline(),
                application.getCaseManager() != null ? application.getCaseManager().getFullName() : null,
                application.getTechnicalReviewer() != null ? application.getTechnicalReviewer().getFullName() : null,
                application.getLegalOfficer() != null ? application.getLegalOfficer().getFullName() : null,

                application.getInfoRequestedReason(),
                application.getInfoRequestedItems(),

                application.getInspectionOfficer() != null ? application.getInspectionOfficer().getFullName() : null,
                null, // inspectionOutcome - populated via inspection report query if needed
                application.getLicenseFeePaidAt(),
                application.getLicenseIssuedBy() != null ? application.getLicenseIssuedBy().getFullName() : null
        );
    }

    public List<AuditEntryResponse> getAuditTrail(UUID applicationId, PortalUserPrincipal principal) {
        loadAccessibleApplication(applicationId, principal);
        List<AuditEntry> entries = auditEntryRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
        Map<UUID, User> actors = userRepository.findAllById(entries.stream().map(AuditEntry::getActorId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return entries.stream()
                .map(entry -> new AuditEntryResponse(
                        entry.getId(),
                        entry.getActorId(),
                        actors.containsKey(entry.getActorId()) ? actors.get(entry.getActorId()).getFullName() : null,
                        entry.getActorRole(),
                        entry.getAction(),
                        entry.getDescription(),
                        entry.getCreatedAt()
                ))
                .toList();
    }

    public Application loadAccessibleApplication(UUID applicationId, PortalUserPrincipal principal) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Application was not found."));
        accessService.assertCanView(application, principal);
        return application;
    }
}
