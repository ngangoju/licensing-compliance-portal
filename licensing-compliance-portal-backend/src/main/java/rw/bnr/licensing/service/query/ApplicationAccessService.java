package rw.bnr.licensing.service.query;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.domain.enums.UserRole;
import rw.bnr.licensing.security.PortalUserPrincipal;

import java.util.EnumSet;
import java.util.Set;

@Service
public class ApplicationAccessService {

    private static final Set<ApplicationStatus> WRITABLE_APPLICANT_STAGES = EnumSet.of(
            ApplicationStatus.DRAFT,
            ApplicationStatus.NAME_APPROVED,
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.INCOMPLETE,
            ApplicationStatus.ADDITIONAL_INFO_REQUESTED,
            ApplicationStatus.ORGANIZATION_PERIOD
    );

    public void assertCanView(Application application, PortalUserPrincipal principal) {
        if (principal.getRole() == UserRole.APPLICANT
                && !application.getApplicant().getId().equals(principal.getId())) {
            throw new AccessDeniedException("Applicants can only access their own applications.");
        }
    }

    public void assertCanUpload(Application application, PortalUserPrincipal principal) {
        assertCanView(application, principal);
        if (principal.getRole() != UserRole.APPLICANT) {
            throw new AccessDeniedException("Only applicants can upload application documents.");
        }
        if (!WRITABLE_APPLICANT_STAGES.contains(application.getStatus())) {
            throw new AccessDeniedException("Documents cannot be uploaded at the current workflow stage.");
        }
    }
}
