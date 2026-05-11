package rw.bnr.licensing.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.entity.FitAndProperAssessment;
import rw.bnr.licensing.domain.entity.InspectionReport;
import rw.bnr.licensing.domain.entity.LicenseCondition;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.domain.enums.LicenseType;
import rw.bnr.licensing.domain.enums.UserRole;
import rw.bnr.licensing.domain.repository.ApplicationDocumentRepository;
import rw.bnr.licensing.domain.repository.ApplicationRepository;
import rw.bnr.licensing.domain.repository.AuditEntryRepository;
import rw.bnr.licensing.domain.repository.InspectionReportRepository;
import rw.bnr.licensing.domain.repository.LicenseConditionRepository;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.dto.application.AddConditionRequest;
import rw.bnr.licensing.dto.application.FulfillConditionRequest;
import rw.bnr.licensing.dto.application.LicenseConditionResponse;
import rw.bnr.licensing.dto.committee.GrantAipRequest;
import rw.bnr.licensing.dto.inspection.ConfirmFeePaymentRequest;
import rw.bnr.licensing.dto.inspection.InspectionReportResponse;
import rw.bnr.licensing.dto.inspection.ScheduleInspectionRequest;
import rw.bnr.licensing.dto.inspection.SubmitInspectionReportRequest;
import rw.bnr.licensing.dto.review.RequestAdditionalInfoRequest;
import rw.bnr.licensing.exception.SeparationOfDutiesException;
import rw.bnr.licensing.security.PortalUserPrincipal;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final LicenseConditionRepository licenseConditionRepository;
    private final InspectionReportRepository inspectionReportRepository;
    private final ApplicationDocumentRepository applicationDocumentRepository;
    private final AuditService auditService;
    private final AuditEntryRepository auditEntryRepository;
    private final StateMachineService stateMachineService;
    private final SlaClockService slaClockService;
    private final FitAndProperService fitAndProperService;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            UserRepository userRepository,
            LicenseConditionRepository licenseConditionRepository,
            InspectionReportRepository inspectionReportRepository,
            ApplicationDocumentRepository applicationDocumentRepository,
            AuditService auditService,
            AuditEntryRepository auditEntryRepository,
            StateMachineService stateMachineService,
            SlaClockService slaClockService,
            FitAndProperService fitAndProperService
    ) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.licenseConditionRepository = licenseConditionRepository;
        this.inspectionReportRepository = inspectionReportRepository;
        this.applicationDocumentRepository = applicationDocumentRepository;
        this.auditService = auditService;
        this.auditEntryRepository = auditEntryRepository;
        this.stateMachineService = stateMachineService;
        this.slaClockService = slaClockService;
        this.fitAndProperService = fitAndProperService;
    }

    public Application createDraft(PortalUserPrincipal applicantPrincipal, String proposedName, LicenseType licenseType, Long proposedCapitalRwf) {
        User applicant = userRepository.findById(applicantPrincipal.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Application application = new Application();
        application.setApplicant(applicant);
        application.setProposedName(proposedName);
        application.setInstitutionName(proposedName);
        application.setProposedCapitalRwf(proposedCapitalRwf != null ? proposedCapitalRwf : 0L);
        application.setForeignInstitution(false);
        application.setLicenseType(licenseType);
        application.setStatus(ApplicationStatus.DRAFT);
        application.setReferenceNumber(generateReferenceNumber());

        Application saved = applicationRepository.save(application);

        auditService.record(saved.getId(), applicantPrincipal, AuditAction.APPLICATION_CREATED, "Draft application created", null, ApplicationStatus.DRAFT.name(), null, null);

        return saved;
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getApplicationsForApplicant(String email) {
        User applicant = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<Application> apps = applicationRepository.findAllByApplicantOrderByUpdatedAtDesc(applicant);
        return apps.stream().map(app -> java.util.Map.<String, Object>of(
                "id", app.getId(),
                "referenceNumber", app.getReferenceNumber(),
                "status", app.getStatus().name(),
                "proposedName", app.getProposedName() != null ? app.getProposedName() : app.getInstitutionName(),
                "licenseType", app.getLicenseType().name(),
                "updatedAt", app.getUpdatedAt()
        )).toList();
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getCaseManagers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.CASE_MANAGER)
                .map(u -> java.util.Map.<String, Object>of(
                        "id", u.getId(),
                        "fullName", u.getFullName()
                ))
                .collect(Collectors.toList());
    }

    public boolean areAllFitAndProperAssessmentsFit(UUID applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));
        return fitAndProperService.areAllAssessmentsFit(applicationId);
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getQueue(PortalUserPrincipal principal) {
        UserRole role = principal.getRole();
        List<Application> apps;

        if (role == UserRole.TECHNICAL_REVIEWER) {
            apps = applicationRepository.findByStatusInOrderByUpdatedAtDesc(List.of(
                    ApplicationStatus.TECHNICAL_REVIEW,
                    ApplicationStatus.ADDITIONAL_INFO_REQUESTED
            ));
        } else if (role == UserRole.INSPECTION_OFFICER) {
            apps = applicationRepository.findByStatusInOrderByUpdatedAtDesc(List.of(
                    ApplicationStatus.PRE_LICENSE_INSPECTION
            ));
        } else if (role == UserRole.LEGAL_OFFICER) {
            apps = applicationRepository.findByStatusInOrderByUpdatedAtDesc(List.of(
                    ApplicationStatus.LEGAL_REVIEW
            ));
        } else if (role == UserRole.FIT_AND_PROPER_OFFICER) {
            apps = applicationRepository.findByStatusInOrderByUpdatedAtDesc(List.of(
                    ApplicationStatus.CASE_ASSIGNED,
                    ApplicationStatus.FIT_AND_PROPER_ASSESSMENT
            ));
        } else if (role == UserRole.LICENSING_COMMITTEE) {
            apps = applicationRepository.findByStatusInOrderByUpdatedAtDesc(List.of(
                    ApplicationStatus.COMMITTEE_DELIBERATION
            ));
        } else if (role == UserRole.GOVERNOR_DELEGATE) {
            apps = applicationRepository.findByStatusInOrderByUpdatedAtDesc(List.of(
                    ApplicationStatus.LICENSE_FEE_PENDING
            ));
        } else if (role == UserRole.AUDITOR) {
            apps = applicationRepository.findByStatusNotOrderByUpdatedAtDesc(ApplicationStatus.DRAFT);
        } else {
            apps = applicationRepository.findByStatusNotOrderByUpdatedAtDesc(ApplicationStatus.DRAFT);
        }

        return apps.stream().map(app -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", app.getId());
            map.put("referenceNumber", app.getReferenceNumber());
            map.put("status", app.getStatus().name());
            map.put("proposedName", app.getProposedName() != null ? app.getProposedName() : app.getInstitutionName());
            map.put("licenseType", app.getLicenseType().name());
            map.put("applicant", app.getApplicant().getFullName());
            map.put("updatedAt", app.getUpdatedAt());
            map.put("caseManagerName", app.getCaseManager() != null ? app.getCaseManager().getFullName() : null);
            map.put("technicalReviewerName", app.getTechnicalReviewer() != null ? app.getTechnicalReviewer().getFullName() : null);
            map.put("inspectionOfficerName", app.getInspectionOfficer() != null ? app.getInspectionOfficer().getFullName() : null);
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    private synchronized String generateReferenceNumber() {
        long count = applicationRepository.count();
        String year = String.valueOf(java.time.Year.now().getValue());
        return String.format("BNR-%s-%04d", year, count + 1);
    }

    public Application transitionState(UUID applicationId, ApplicationStatus toStatus, PortalUserPrincipal actorPrincipal, String reason) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        ApplicationStatus fromStatus = application.getStatus();
        stateMachineService.assertTransition(fromStatus, toStatus);

        application.setStatus(toStatus);

        if (toStatus == ApplicationStatus.REJECTED) {
            application.setRejectionReason(reason);
        } else if (toStatus == ApplicationStatus.INCOMPLETE) {
            application.setCompletenessNotes(reason);
        }

        // SLA Clock Logic
        if (toStatus == ApplicationStatus.CASE_ASSIGNED) {
            slaClockService.startClock(application);
        } else if (toStatus == ApplicationStatus.INCOMPLETE || toStatus == ApplicationStatus.ADDITIONAL_INFO_REQUESTED) {
            slaClockService.pauseClock(application, reason);
        } else if (fromStatus == ApplicationStatus.INCOMPLETE || fromStatus == ApplicationStatus.ADDITIONAL_INFO_REQUESTED) {
            slaClockService.resumeClock(application);
        }

        // Terminal states and SLA stops
        if (toStatus == ApplicationStatus.APPROVAL_IN_PRINCIPLE || toStatus == ApplicationStatus.REJECTED || toStatus == ApplicationStatus.WITHDRAWN) {
            application.setFinalStatusAt(Instant.now());
        }

        Application saved = applicationRepository.save(application);

        AuditAction action = determineAuditAction(fromStatus, toStatus);
        auditService.record(saved.getId(), actorPrincipal, action, reason, fromStatus.name(), toStatus.name(), null, null);

        return saved;
    }

    private AuditAction determineAuditAction(ApplicationStatus from, ApplicationStatus to) {
        if (to == ApplicationStatus.SUBMITTED) return AuditAction.APPLICATION_SUBMITTED;
        if (to == ApplicationStatus.NAME_APPROVAL_PENDING) return AuditAction.NAME_APPROVAL_REQUESTED;
        if (to == ApplicationStatus.NAME_APPROVED) return AuditAction.NAME_APPROVED;
        if (to == ApplicationStatus.COMPLETENESS_CHECK) return AuditAction.COMPLETENESS_CHECK_STARTED;
        if (to == ApplicationStatus.INCOMPLETE) return AuditAction.COMPLETENESS_FAILED;
        if (from == ApplicationStatus.ADDITIONAL_INFO_REQUESTED) return AuditAction.ADDITIONAL_INFO_PROVIDED;
        if (to == ApplicationStatus.CASE_ASSIGNED) return AuditAction.CASE_MANAGER_ASSIGNED;
        if (to == ApplicationStatus.FIT_AND_PROPER_ASSESSMENT) return AuditAction.FIT_AND_PROPER_STARTED;
        if (to == ApplicationStatus.TECHNICAL_REVIEW) return AuditAction.TECHNICAL_REVIEW_STARTED;
        if (to == ApplicationStatus.LEGAL_REVIEW) return AuditAction.LEGAL_REVIEW_STARTED;
        if (to == ApplicationStatus.COMMITTEE_DELIBERATION) return AuditAction.COMMITTEE_DELIBERATION_STARTED;
        if (to == ApplicationStatus.APPROVAL_IN_PRINCIPLE) return AuditAction.APPROVAL_IN_PRINCIPLE_GRANTED;
        if (to == ApplicationStatus.REJECTED) return AuditAction.APPLICATION_REJECTED;
        if (to == ApplicationStatus.WITHDRAWN) return AuditAction.APPLICATION_WITHDRAWN;
        if (to == ApplicationStatus.ADDITIONAL_INFO_REQUESTED) return AuditAction.ADDITIONAL_INFO_REQUESTED;
        if (to == ApplicationStatus.ORGANIZATION_PERIOD) return AuditAction.ORGANIZATION_PERIOD_STARTED;

        return AuditAction.DOCUMENT_UPLOADED;
    }

    public Application assignCaseManager(UUID applicationId, UUID caseManagerId, PortalUserPrincipal principal) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        User caseManager = userRepository.findById(caseManagerId)
                .orElseThrow(() -> new IllegalArgumentException("Case manager not found"));

        if (caseManager.getRole() != UserRole.CASE_MANAGER) {
            throw new IllegalArgumentException("User is not a case manager");
        }

        application.setCaseManager(caseManager);

        return transitionState(applicationId, ApplicationStatus.CASE_ASSIGNED, principal, "Assigned case manager: " + caseManager.getFullName());
    }


    public void startTechnicalReview(UUID applicationId, PortalUserPrincipal actor, String notes) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        User reviewer = userRepository.findById(actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (app.getStatus() != ApplicationStatus.TECHNICAL_REVIEW) {
            stateMachineService.assertTransition(app.getStatus(), ApplicationStatus.TECHNICAL_REVIEW);
        }

        app.setTechnicalReviewer(reviewer);
        if (notes != null && !notes.isBlank()) {
            app.setTechnicalReviewNotes(notes);
        }

        applicationRepository.save(app);

        auditService.record(app.getId(), actor, AuditAction.TECHNICAL_REVIEW_STARTED,
                "Technical review started by " + reviewer.getFullName(),
                app.getStatus().name(), ApplicationStatus.TECHNICAL_REVIEW.name(), null, null);
    }

    public Application completeTechnicalReview(UUID applicationId, PortalUserPrincipal actor, String notes) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (app.getStatus() != ApplicationStatus.TECHNICAL_REVIEW) {
            throw new IllegalStateException("Application is not in TECHNICAL_REVIEW status");
        }

        if (notes != null && !notes.isBlank()) {
            app.setTechnicalReviewNotes(notes);
        }

        return transitionState(applicationId, ApplicationStatus.LEGAL_REVIEW, actor, "Technical review completed. " + (notes != null ? notes : ""));
    }


    public void requestAdditionalInfo(UUID applicationId, PortalUserPrincipal actor, RequestAdditionalInfoRequest request) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        String reason = request.reason() != null ? request.reason() : "Additional information requested";
        String infoSummary = String.join(", ", request.infoRequested());

        ApplicationStatus fromStatus = app.getStatus();
        stateMachineService.assertTransition(fromStatus, ApplicationStatus.ADDITIONAL_INFO_REQUESTED);

        slaClockService.pauseClock(app, reason + (infoSummary != null ? " - Info requested: " + infoSummary : ""));
        app.setStatus(ApplicationStatus.ADDITIONAL_INFO_REQUESTED);
        app.setInfoRequestedReason(reason);
        app.setInfoRequestedItems(request.infoRequested() != null ? request.infoRequested() : (reason != null ? List.of(reason) : List.of("Documentation clarification")));
        applicationRepository.save(app);

        auditService.record(app.getId(), actor, AuditAction.ADDITIONAL_INFO_REQUESTED,
                reason + " | Info requested: " + infoSummary,
                fromStatus.name(), ApplicationStatus.ADDITIONAL_INFO_REQUESTED.name(), null, null);
    }

    public Application respondToAdditionalInfo(UUID applicationId, PortalUserPrincipal actor, ApplicationStatus returnToState, String responseNotes) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (app.getStatus() != ApplicationStatus.ADDITIONAL_INFO_REQUESTED) {
            throw new IllegalStateException("Application is not awaiting additional information");
        }

        ApplicationStatus fromStatus = app.getStatus();

        // Default return states based on which review stage asked for info
        ApplicationStatus targetState = returnToState;
        if (targetState == null) {
            // Fetch the previous state from the audit log
            targetState = auditEntryRepository.findFirstByApplicationIdAndActionOrderByCreatedAtDesc(applicationId, AuditAction.ADDITIONAL_INFO_REQUESTED)
                    .map(entry -> {
                        try {
                            return ApplicationStatus.valueOf(entry.getPreviousState().replace("\"", ""));
                        } catch (Exception e) {
                            return ApplicationStatus.TECHNICAL_REVIEW;
                        }
                    })
                    .orElse(ApplicationStatus.TECHNICAL_REVIEW);
        }

        stateMachineService.assertTransition(fromStatus, targetState);
        slaClockService.resumeClock(app);

        return transitionState(applicationId, targetState, actor, "Additional information provided. " + (responseNotes != null ? responseNotes : ""));
    }


    public void startLegalReview(UUID applicationId, PortalUserPrincipal actor, String notes) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        User reviewer = userRepository.findById(actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (app.getStatus() != ApplicationStatus.LEGAL_REVIEW) {
            stateMachineService.assertTransition(app.getStatus(), ApplicationStatus.LEGAL_REVIEW);
        }

        app.setLegalOfficer(reviewer);
        if (notes != null && !notes.isBlank()) {
            app.setLegalReviewNotes(notes);
        }

        applicationRepository.save(app);

        auditService.record(app.getId(), actor, AuditAction.LEGAL_REVIEW_STARTED,
                "Legal review started by " + reviewer.getFullName(),
                app.getStatus().name(), ApplicationStatus.LEGAL_REVIEW.name(), null, null);
    }

    public Application completeLegalReview(UUID applicationId, PortalUserPrincipal actor, String notes) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (app.getStatus() != ApplicationStatus.LEGAL_REVIEW) {
            throw new IllegalStateException("Application is not in LEGAL_REVIEW status");
        }

        if (notes != null && !notes.isBlank()) {
            app.setLegalReviewNotes(notes);
        }

        return transitionState(applicationId, ApplicationStatus.COMMITTEE_DELIBERATION, actor, "Legal review completed. " + (notes != null ? notes : ""));
    }


    public void startCommitteeDeliberation(UUID applicationId, PortalUserPrincipal actor, String notes) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        stateMachineService.assertTransition(app.getStatus(), ApplicationStatus.COMMITTEE_DELIBERATION);
        app.setStatus(ApplicationStatus.COMMITTEE_DELIBERATION);
        applicationRepository.save(app);

        auditService.record(app.getId(), actor, AuditAction.COMMITTEE_DELIBERATION_STARTED,
                "Committee deliberation started. " + (notes != null ? notes : ""),
                ApplicationStatus.LEGAL_REVIEW.name(), ApplicationStatus.COMMITTEE_DELIBERATION.name(), null, null);
    }


    public Application grantApprovalInPrinciple(UUID applicationId, PortalUserPrincipal actor, GrantAipRequest request) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        User grantee = userRepository.findById(actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        stateMachineService.assertTransition(app.getStatus(), ApplicationStatus.APPROVAL_IN_PRINCIPLE);

        // Set AIP fields
        Instant now = Instant.now();
        app.setAipGrantedAt(now);
        app.setAipGrantedBy(grantee);
        Instant expiresAt = now.plus(365, ChronoUnit.DAYS);
        app.setAipExpiresAt(expiresAt);
        app.setOrganizationDeadline(expiresAt);

        // Create license conditions
        if (request.conditions() != null) {
            for (GrantAipRequest.ConditionInput condInput : request.conditions()) {
                LicenseCondition condition = new LicenseCondition();
                condition.setApplication(app);
                condition.setConditionText(condInput.conditionText());
                condition.setCategory(condInput.category());
                condition.setDueDate(condInput.dueDate());
                condition.setFulfilled(false);
                app.getConditions().add(condition);
            }
        }

        app.setStatus(ApplicationStatus.APPROVAL_IN_PRINCIPLE);
        applicationRepository.save(app);

        // Trigger lazy loading of conditions so they are available in the controller
        app.getConditions().size();

        auditService.record(app.getId(), actor, AuditAction.APPROVAL_IN_PRINCIPLE_GRANTED,
                "AIP granted with " + (request.conditions() != null ? request.conditions().size() : 0) + " conditions. " + (request.notes() != null ? request.notes() : ""),
                ApplicationStatus.COMMITTEE_DELIBERATION.name(), ApplicationStatus.APPROVAL_IN_PRINCIPLE.name(), null, null);

        // Record each condition added
        if (request.conditions() != null) {
            for (GrantAipRequest.ConditionInput condInput : request.conditions()) {
                auditService.record(app.getId(), actor, AuditAction.CONDITION_ADDED,
                        "Condition added: " + condInput.conditionText() + " [" + condInput.category() + "]",
                        null, null, null, null);
            }
        }

        return app;
    }

    public Application denyApprovalInPrinciple(UUID applicationId, PortalUserPrincipal actor, String reason) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        stateMachineService.assertTransition(app.getStatus(), ApplicationStatus.REJECTED);

        app.setRejectionReason(reason);
        app.setFinalStatusAt(Instant.now());
        app.setStatus(ApplicationStatus.REJECTED);
        applicationRepository.save(app);

        auditService.record(app.getId(), actor, AuditAction.APPROVAL_IN_PRINCIPLE_DENIED,
                "AIP denied: " + reason,
                ApplicationStatus.COMMITTEE_DELIBERATION.name(), ApplicationStatus.REJECTED.name(), null, null);

        return app;
    }


    @Transactional(readOnly = true)
    public List<LicenseConditionResponse> getLicenseConditions(UUID applicationId) {
        List<LicenseCondition> conditions = licenseConditionRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId);
        return conditions.stream().map(this::toConditionResponse).collect(Collectors.toList());
    }

    public LicenseConditionResponse addLicenseCondition(UUID applicationId, AddConditionRequest request, PortalUserPrincipal actor) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        LicenseCondition condition = new LicenseCondition();
        condition.setApplication(app);
        condition.setConditionText(request.conditionText());
        condition.setCategory(request.category());
        condition.setDueDate(request.dueDate());
        condition.setFulfilled(false);

        LicenseCondition saved = licenseConditionRepository.save(condition);

        auditService.record(app.getId(), actor, AuditAction.CONDITION_ADDED,
                "Condition added: " + request.conditionText() + " [" + request.category() + "]",
                null, null, null, null);

        return toConditionResponse(saved);
    }

    public LicenseConditionResponse fulfillLicenseCondition(UUID applicationId, UUID conditionId, FulfillConditionRequest request, PortalUserPrincipal actor) {
        LicenseCondition condition = licenseConditionRepository.findById(conditionId)
                .orElseThrow(() -> new IllegalArgumentException("Condition not found"));

        if (!condition.getApplication().getId().equals(applicationId)) {
            throw new IllegalArgumentException("Condition does not belong to this application");
        }

        User user = userRepository.findById(actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        condition.setFulfilled(true);
        condition.setFulfilledAt(Instant.now());
        condition.setFulfilledBy(user);
        condition.setFulfillmentNote(request.fulfillmentNote());

        if (request.documentId() != null) {
            condition.setFulfillmentDocument(applicationDocumentRepository.findById(request.documentId())
                    .orElseThrow(() -> new IllegalArgumentException("Document not found: " + request.documentId())));
        }

        LicenseCondition saved = licenseConditionRepository.save(condition);

        auditService.record(applicationId, actor, AuditAction.CONDITION_FULFILLED,
                "Condition fulfilled: " + condition.getConditionText() + (request.fulfillmentNote() != null ? " - " + request.fulfillmentNote() : ""),
                null, null, null, null);

        return toConditionResponse(saved);
    }


    public void requestInspection(UUID applicationId, PortalUserPrincipal actor, ScheduleInspectionRequest request) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        User officer = userRepository.findById(actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (officer.getRole() != UserRole.INSPECTION_OFFICER) {
            throw new IllegalArgumentException("User is not an inspection officer");
        }

        stateMachineService.assertTransition(app.getStatus(), ApplicationStatus.PRE_LICENSE_INSPECTION);

        app.setInspectionOfficer(officer);
        app.setStatus(ApplicationStatus.PRE_LICENSE_INSPECTION);
        applicationRepository.save(app);

        // Create inspection report with scheduled date
        InspectionReport report = new InspectionReport();
        report.setApplication(app);
        report.setInspectionOfficer(officer);
        report.setScheduledDate(request.scheduledDate());
        inspectionReportRepository.save(report);

        auditService.record(app.getId(), actor, AuditAction.INSPECTION_SCHEDULED,
                "Inspection scheduled for " + request.scheduledDate() + " by " + officer.getFullName(),
                ApplicationStatus.ORGANIZATION_PERIOD.name(), ApplicationStatus.PRE_LICENSE_INSPECTION.name(), null, null);
    }

    public InspectionReportResponse submitInspectionReport(UUID applicationId, PortalUserPrincipal actor, SubmitInspectionReportRequest request) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (app.getStatus() != ApplicationStatus.PRE_LICENSE_INSPECTION) {
            throw new IllegalStateException("Application is not in PRE_LICENSE_INSPECTION status");
        }

        InspectionReport report = inspectionReportRepository.findByApplicationId(applicationId)
                .orElseThrow(() -> new IllegalStateException("Inspection report not found"));

        // Update report with results
        report.setConductedDate(request.conductedDate());
        report.setPremisesVerified(request.premisesVerified());
        report.setCapitalVerified(request.capitalVerified());
        report.setCapitalAmountRwf(request.capitalAmountRwf());
        report.setItSystemsVerified(request.itSystemsVerified());
        report.setAmlFrameworkOk(request.amlFrameworkOk());
        report.setStaffingAdequate(request.staffingAdequate());
        report.setPolicyManualsOk(request.policyManualsOk());
        report.setOverallOutcome(request.overallOutcome());
        report.setFindings(request.findings());

        InspectionReport saved = inspectionReportRepository.save(report);

        // Determine transition based on outcome
        ApplicationStatus toStatus;
        AuditAction auditAction;

        if ("PASSED".equalsIgnoreCase(request.overallOutcome())) {
            toStatus = ApplicationStatus.LICENSE_FEE_PENDING;
            auditAction = AuditAction.INSPECTION_PASSED;
        } else {
            toStatus = ApplicationStatus.INSPECTION_FAILED;
            auditAction = AuditAction.INSPECTION_FAILED;
        }

        transitionState(applicationId, toStatus, actor, "Inspection " + request.overallOutcome() + ". " + (request.findings() != null ? request.findings() : ""));

        return toInspectionReportResponse(saved);
    }

    public Application confirmFeePayment(UUID applicationId, PortalUserPrincipal actor, ConfirmFeePaymentRequest request) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (app.getStatus() != ApplicationStatus.LICENSE_FEE_PENDING) {
            throw new IllegalStateException("Application is not in LICENSE_FEE_PENDING status");
        }

        app.setLicenseFeePaidAt(Instant.now());
        applicationRepository.save(app);

        auditService.record(app.getId(), actor, AuditAction.LICENSE_FEE_RECEIVED,
                "License fee confirmed. Amount: " + request.amountRwf() + " RWF. Reference: " + (request.paymentReference() != null ? request.paymentReference() : "N/A"),
                ApplicationStatus.LICENSE_FEE_PENDING.name(), ApplicationStatus.LICENSE_FEE_PENDING.name(), null, null);

        return app;
    }

    public Application issueLicense(UUID applicationId, PortalUserPrincipal actor) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        if (app.getStatus() != ApplicationStatus.LICENSE_FEE_PENDING) {
            throw new IllegalStateException("Application is not in LICENSE_FEE_PENDING status");
        }

        // Separation of duties: reviewers cannot issue the final license
        // Enforced across: AIP granter, technical reviewer, compliance officer, legal officer
        java.util.Set<java.util.UUID> reviewerIds = new java.util.HashSet<>();
        if (app.getAipGrantedBy() != null) reviewerIds.add(app.getAipGrantedBy().getId());
        if (app.getTechnicalReviewer() != null) reviewerIds.add(app.getTechnicalReviewer().getId());
        if (app.getComplianceOfficer() != null) reviewerIds.add(app.getComplianceOfficer().getId());
        if (app.getLegalOfficer() != null) reviewerIds.add(app.getLegalOfficer().getId());

        if (reviewerIds.contains(actor.getId())) {
            throw new SeparationOfDutiesException(
                "Separation of duties violation: a user who reviewed or approved this application cannot issue the final license."
            );
        }

        User issuer = userRepository.findById(actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Generate license number
        String licenseNumber = generateLicenseNumber(app);
        app.setLicenseNumber(licenseNumber);
        app.setLicenseIssuedAt(Instant.now());
        app.setLicenseIssuedBy(issuer);

        Application saved = transitionState(applicationId, ApplicationStatus.LICENSED, actor, "License issued. Number: " + licenseNumber);

        auditService.record(app.getId(), actor, AuditAction.LICENSE_ISSUED,
                "License issued to " + app.getInstitutionName() + ". License number: " + licenseNumber,
                ApplicationStatus.LICENSE_FEE_PENDING.name(), ApplicationStatus.LICENSED.name(), null, null);

        return saved;
    }

    private String generateLicenseNumber(Application app) {
        String prefix = switch (app.getLicenseType()) {
            case COMMERCIAL_BANK -> "CB";
            case MICROFINANCE_INSTITUTION_TIER1, MICROFINANCE_INSTITUTION_TIER2 -> "MF";
            case SAVINGS_CREDIT_COOPERATIVE -> "SACCO";
            case FOREX_BUREAU -> "FX";
            case PAYMENT_SERVICE_PROVIDER -> "PSP";
            case DEVELOPMENT_FINANCE_INSTITUTION -> "DFI";
            case REPRESENTATIVE_OFFICE -> "RO";
        };
        String year = String.valueOf(java.time.Year.now().getValue());
        String random = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return prefix + "-" + year + "-" + random;
    }

    private InspectionReportResponse toInspectionReportResponse(InspectionReport report) {
        return new InspectionReportResponse(
                report.getId(),
                report.getApplication().getId(),
                report.getInspectionOfficer().getFullName(),
                report.getScheduledDate(),
                report.getConductedDate(),
                report.getPremisesVerified(),
                report.getCapitalVerified(),
                report.getCapitalAmountRwf(),
                report.getItSystemsVerified(),
                report.getAmlFrameworkOk(),
                report.getStaffingAdequate(),
                report.getPolicyManualsOk(),
                report.getOverallOutcome(),
                report.getFindings(),
                report.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDecisionSummary(UUID applicationId) {
        Application app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("id", app.getId());
        summary.put("referenceNumber", app.getReferenceNumber());
        summary.put("proposedName", app.getProposedName());
        summary.put("licenseType", app.getLicenseType().name());
        summary.put("status", app.getStatus().name());
        summary.put("applicantName", app.getApplicant().getFullName());

        // Fit & Proper
        List<FitAndProperAssessment> assessments = fitAndProperService.getAssessments(applicationId);
        summary.put("fpTotal", assessments.size());
        summary.put("fpFit", assessments.stream().filter(a -> "FIT".equals(a.getOutcome())).count());
        summary.put("fpNotFit", assessments.stream().filter(a -> "NOT_FIT".equals(a.getOutcome())).count());
        summary.put("fpPending", assessments.stream().filter(a -> "PENDING".equals(a.getOutcome()) || a.getOutcome() == null).count());

        // Reviews
        summary.put("technicalReviewNotes", app.getTechnicalReviewNotes());
        summary.put("legalReviewNotes", app.getLegalReviewNotes());
        summary.put("technicalReviewer", app.getTechnicalReviewer() != null ? app.getTechnicalReviewer().getFullName() : null);
        summary.put("legalOfficer", app.getLegalOfficer() != null ? app.getLegalOfficer().getFullName() : null);

        // Inspection
        Optional<InspectionReport> reportOpt = inspectionReportRepository.findByApplicationId(applicationId);
        if (reportOpt.isPresent()) {
            InspectionReport report = reportOpt.get();
            Map<String, Object> inspection = new java.util.HashMap<>();
            inspection.put("outcome", report.getOverallOutcome());
            inspection.put("conductedDate", report.getConductedDate());
            inspection.put("findings", report.getFindings());
            summary.put("inspection", inspection);
        }

        return summary;
    }

    private LicenseConditionResponse toConditionResponse(LicenseCondition condition) {
        return new LicenseConditionResponse(
                condition.getId(),
                condition.getConditionText(),
                condition.getCategory(),
                condition.isFulfilled(),
                condition.getFulfilledAt(),
                condition.getFulfilledBy() != null ? condition.getFulfilledBy().getFullName() : null,
                condition.getFulfillmentNote(),
                condition.getFulfillmentDocument() != null ? condition.getFulfillmentDocument().getId() : null,
                condition.getDueDate(),
                condition.getCreatedAt()
        );
    }
}