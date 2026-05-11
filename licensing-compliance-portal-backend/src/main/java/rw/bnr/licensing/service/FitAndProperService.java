package rw.bnr.licensing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.entity.FitAndProperAssessment;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.domain.repository.ApplicationRepository;
import rw.bnr.licensing.domain.repository.FitAndProperAssessmentRepository;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.exception.NotFoundException;
import rw.bnr.licensing.security.PortalUserPrincipal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class FitAndProperService {

    private final FitAndProperAssessmentRepository repository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public FitAndProperService(FitAndProperAssessmentRepository repository,
                               ApplicationRepository applicationRepository,
                               UserRepository userRepository,
                               AuditService auditService) {
        this.repository = repository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<FitAndProperAssessment> getAssessments(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Application not found: " + applicationId));
        return repository.findAllByApplication(application);
    }

    @Transactional(readOnly = true)
    public FitAndProperAssessment getAssessment(UUID assessmentId) {
        return repository.findById(assessmentId)
                .orElseThrow(() -> new NotFoundException("Assessment not found: " + assessmentId));
    }

    public FitAndProperAssessment createAssessment(UUID applicationId,
                                                    CreateAssessmentRequest request,
                                                    PortalUserPrincipal principal) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Application not found: " + applicationId));

        User officer = userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        FitAndProperAssessment assessment = new FitAndProperAssessment();
        assessment.setApplication(application);
        assessment.setIndividualName(request.individualName());
        assessment.setIndividualRole(request.individualRole());
        assessment.setShareholdingPct(request.shareholdingPct());
        assessment.setNationalId(request.nationalId());
        assessment.setNationality(request.nationality());
        assessment.setAssessedBy(officer);
        assessment.setOutcome("PENDING");
        assessment.setInterviewConducted(false);

        FitAndProperAssessment saved = repository.save(assessment);

        auditService.record(applicationId, principal, AuditAction.FIT_AND_PROPER_STARTED,
                "Added individual for F&P assessment: " + request.individualName() + " (" + request.individualRole() + ")",
                application.getStatus().name(), application.getStatus().name(),
                "127.0.0.1", "Backend");

        return saved;
    }

    public FitAndProperAssessment updateAssessment(UUID assessmentId,
                                                    UpdateAssessmentRequest request,
                                                    PortalUserPrincipal principal) {
        FitAndProperAssessment assessment = repository.findById(assessmentId)
                .orElseThrow(() -> new NotFoundException("Assessment not found: " + assessmentId));

        if (request.criminalRecordClear() != null) {
            assessment.setCriminalRecordClear(request.criminalRecordClear());
        }
        if (request.financialHistoryClear() != null) {
            assessment.setFinancialHistoryClear(request.financialHistoryClear());
        }
        if (request.qualificationsAdequate() != null) {
            assessment.setQualificationsAdequate(request.qualificationsAdequate());
        }
        if (request.noConflictOfInterest() != null) {
            assessment.setNoConflictOfInterest(request.noConflictOfInterest());
        }
        if (request.interviewConducted() != null) {
            assessment.setInterviewConducted(request.interviewConducted());
        }
        if (request.interviewDate() != null) {
            assessment.setInterviewDate(request.interviewDate());
        }
        if (request.interviewNotes() != null) {
            assessment.setInterviewNotes(request.interviewNotes());
        }
        if (request.shareholdingPct() != null) {
            assessment.setShareholdingPct(request.shareholdingPct());
        }
        if (request.nationalId() != null) {
            assessment.setNationalId(request.nationalId());
        }
        if (request.nationality() != null) {
            assessment.setNationality(request.nationality());
        }

        assessment.setAssessedBy(userRepository.findById(principal.getId()).orElse(null));

        FitAndProperAssessment saved = repository.save(assessment);

        auditService.record(assessment.getApplication().getId(), principal,
                AuditAction.FIT_AND_PROPER_STARTED,
                "Updated F&P assessment for " + assessment.getIndividualName(),
                assessment.getApplication().getStatus().name(),
                assessment.getApplication().getStatus().name(),
                "127.0.0.1", "Backend");

        return saved;
    }

    public void concludeAssessment(UUID assessmentId,
                                   ConcludeAssessmentRequest request,
                                   PortalUserPrincipal principal) {
        FitAndProperAssessment assessment = repository.findById(assessmentId)
                .orElseThrow(() -> new NotFoundException("Assessment not found: " + assessmentId));

        assessment.setOutcome(request.outcome());
        assessment.setOutcomeNotes(request.outcomeNotes());
        assessment.setAssessedBy(userRepository.findById(principal.getId()).orElse(null));
        assessment.setAssessedAt(Instant.now());

        repository.save(assessment);

        auditService.record(assessment.getApplication().getId(), principal,
                AuditAction.FIT_AND_PROPER_COMPLETED,
                "Concluded F&P for " + assessment.getIndividualName() + " as " + request.outcome(),
                assessment.getApplication().getStatus().name(),
                assessment.getApplication().getStatus().name(),
                "127.0.0.1", "Backend");
    }

    @Transactional(readOnly = true)
    public boolean areAllAssessmentsFit(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new NotFoundException("Application not found: " + applicationId));
        List<FitAndProperAssessment> assessments = repository.findAllByApplication(application);

        if (assessments.isEmpty()) {
            return false;
        }

        return assessments.stream().allMatch(a -> "FIT".equals(a.getOutcome()));
    }



    public record CreateAssessmentRequest(
            String individualName,
            String individualRole,
            Double shareholdingPct,
            String nationalId,
            String nationality
    ) {}

    public record UpdateAssessmentRequest(
            Boolean criminalRecordClear,
            Boolean financialHistoryClear,
            Boolean qualificationsAdequate,
            Boolean noConflictOfInterest,
            Boolean interviewConducted,
            java.time.LocalDate interviewDate,
            String interviewNotes,
            Double shareholdingPct,
            String nationalId,
            String nationality
    ) {}

    public record ConcludeAssessmentRequest(
            String outcome,
            String outcomeNotes
    ) {}
}
