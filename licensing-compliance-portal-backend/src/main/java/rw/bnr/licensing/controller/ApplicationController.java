package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.dto.application.AddConditionRequest;
import rw.bnr.licensing.dto.application.ApplicationDetailResponse;
import rw.bnr.licensing.dto.application.FulfillConditionRequest;
import rw.bnr.licensing.dto.application.LicenseConditionResponse;
import rw.bnr.licensing.dto.committee.DenyAipRequest;
import rw.bnr.licensing.dto.committee.GrantAipRequest;
import rw.bnr.licensing.dto.committee.StartCommitteeDeliberationRequest;
import rw.bnr.licensing.dto.inspection.ConfirmFeePaymentRequest;
import rw.bnr.licensing.dto.inspection.InspectionReportResponse;
import rw.bnr.licensing.dto.inspection.ScheduleInspectionRequest;
import rw.bnr.licensing.dto.inspection.SubmitInspectionReportRequest;
import rw.bnr.licensing.dto.review.CompleteReviewRequest;
import rw.bnr.licensing.dto.review.RequestAdditionalInfoRequest;
import rw.bnr.licensing.dto.review.StartReviewRequest;
import rw.bnr.licensing.dto.audit.AuditEntryResponse;
import rw.bnr.licensing.security.PortalUserPrincipal;
import rw.bnr.licensing.service.ApplicationService;
import rw.bnr.licensing.service.query.ApplicationQueryService;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
@Tag(name = "Applications", description = "Application workflow endpoints")
public class ApplicationController {

    private final ApplicationQueryService applicationQueryService;
    private final ApplicationService applicationService;

    public ApplicationController(ApplicationQueryService applicationQueryService, ApplicationService applicationService) {
        this.applicationQueryService = applicationQueryService;
        this.applicationService = applicationService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single application detail view")
    public ApplicationDetailResponse getApplication(
            @PathVariable UUID id,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        return applicationQueryService.getApplication(id, principal);
    }

    @GetMapping("/{id}/audit")
    @Operation(summary = "Get the audit timeline for an application")
    public List<AuditEntryResponse> getAuditTrail(
            @PathVariable UUID id,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        return applicationQueryService.getAuditTrail(id, principal);
    }

    @PostMapping("/draft")
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<?> createDraft(@Valid @RequestBody CreateDraftRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application application = applicationService.createDraft(principal, request.proposedName, request.licenseType, request.proposedCapitalRwf);
        return ResponseEntity.ok(Map.of(
                "id", application.getId(),
                "referenceNumber", application.getReferenceNumber(),
                "status", application.getStatus(),
                "proposedName", application.getProposedName(),
                "licenseType", application.getLicenseType()
        ));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<List<Map<String, Object>>> getMyApplications(org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(applicationService.getApplicationsForApplicant(authentication.getName()));
    }

    @GetMapping("/case-managers")
    @PreAuthorize("hasRole('COMPLIANCE_OFFICER')")
    public ResponseEntity<List<Map<String, Object>>> getCaseManagers() {
        return ResponseEntity.ok(applicationService.getCaseManagers());
    }

    @GetMapping("/queue")
    @PreAuthorize("hasAnyRole('CASE_MANAGER', 'COMPLIANCE_OFFICER', 'TECHNICAL_REVIEWER', 'FIT_AND_PROPER_OFFICER', 'LEGAL_OFFICER', 'INSPECTION_OFFICER', 'LICENSING_COMMITTEE', 'GOVERNOR_DELEGATE', 'ADMIN', 'AUDITOR')")
    public ResponseEntity<List<Map<String, Object>>> getQueue(@AuthenticationPrincipal PortalUserPrincipal principal) {
        return ResponseEntity.ok(applicationService.getQueue(principal));
    }


    @PostMapping("/{id}/submit-name-approval")
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<?> submitNameApproval(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal, HttpServletRequest request) {
        Application app = applicationService.transitionState(id, ApplicationStatus.NAME_APPROVAL_PENDING, principal, "Requested name approval");
        return ResponseEntity.ok(app.getStatus());
    }

    @PostMapping("/{id}/approve-name")
    @PreAuthorize("hasRole('COMPLIANCE_OFFICER')")
    public ResponseEntity<?> approveName(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal, HttpServletRequest request) {
        Application app = applicationService.transitionState(id, ApplicationStatus.NAME_APPROVED, principal, "Name approved");
        return ResponseEntity.ok(app.getStatus());
    }

    @PostMapping("/{id}/reject-name")
    @PreAuthorize("hasRole('COMPLIANCE_OFFICER')")
    public ResponseEntity<?> rejectName(@PathVariable UUID id, @RequestBody TransitionRequest request, @AuthenticationPrincipal PortalUserPrincipal principal, HttpServletRequest httpRequest) {
        Application app = applicationService.transitionState(id, ApplicationStatus.DRAFT, principal, request.reason);
        return ResponseEntity.ok(app.getStatus());
    }


    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<?> submitApplication(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal, HttpServletRequest request) {
        Application app = applicationService.transitionState(id, ApplicationStatus.SUBMITTED, principal, "Application submitted for review");
        return ResponseEntity.ok(app.getStatus());
    }


    @PostMapping("/{id}/start-completeness-check")
    @PreAuthorize("hasRole('COMPLIANCE_OFFICER')")
    public ResponseEntity<?> startCompletenessCheck(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal, HttpServletRequest request) {
        Application app = applicationService.transitionState(id, ApplicationStatus.COMPLETENESS_CHECK, principal, "Completeness check started");
        return ResponseEntity.ok(app.getStatus());
    }

    @PostMapping("/{id}/mark-incomplete")
    @PreAuthorize("hasRole('COMPLIANCE_OFFICER')")
    public ResponseEntity<?> markIncomplete(@PathVariable UUID id, @RequestBody TransitionRequest request, @AuthenticationPrincipal PortalUserPrincipal principal, HttpServletRequest httpRequest) {
        Application app = applicationService.transitionState(id, ApplicationStatus.INCOMPLETE, principal, request.reason);
        return ResponseEntity.ok(app.getStatus());
    }


    @PostMapping("/{id}/assign-case-manager")
    @PreAuthorize("hasRole('COMPLIANCE_OFFICER')")
    public ResponseEntity<?> assignCaseManager(@PathVariable UUID id, @RequestBody Map<String, String> body, @AuthenticationPrincipal PortalUserPrincipal principal) {
        String caseManagerIdStr = body.get("caseManagerId");
        if (caseManagerIdStr == null || caseManagerIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Case Manager ID is required."));
        }
        UUID caseManagerId = UUID.fromString(caseManagerIdStr);
        applicationService.assignCaseManager(id, caseManagerId, principal);
        return ResponseEntity.ok(Map.of("message", "Case Manager assigned successfully."));
    }


    @PostMapping("/{id}/start-fit-and-proper")
    @PreAuthorize("hasRole('CASE_MANAGER')")
    public ResponseEntity<?> startFitAndProper(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal) {
        applicationService.transitionState(id, ApplicationStatus.FIT_AND_PROPER_ASSESSMENT, principal, "Started Fit and Proper Assessment");
        return ResponseEntity.ok(Map.of("message", "Fit and Proper Assessment started."));
    }

    @PostMapping("/{id}/complete-fit-and-proper")
    @PreAuthorize("hasRole('CASE_MANAGER') or hasRole('FIT_AND_PROPER_OFFICER')")
    public ResponseEntity<?> completeFitAndProper(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal) {
        boolean allFit = applicationService.areAllFitAndProperAssessmentsFit(id);
        if (!allFit) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Cannot complete Fit and Proper Assessment: not all individuals have been assessed as FIT.")
            );
        }
        applicationService.transitionState(id, ApplicationStatus.TECHNICAL_REVIEW, principal, "Fit and Proper Assessment concluded.");
        return ResponseEntity.ok(Map.of("message", "Fit and Proper Assessment concluded."));
    }


    @PostMapping("/{id}/start-technical-review")
    @PreAuthorize("hasRole('TECHNICAL_REVIEWER')")
    public ResponseEntity<?> startTechnicalReview(@PathVariable UUID id, @RequestBody(required = false) StartReviewRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        String notes = request != null ? request.notes() : null;
        applicationService.startTechnicalReview(id, principal, notes);
        return ResponseEntity.ok(Map.of("message", "Technical review started."));
    }

    @PostMapping("/{id}/complete-technical-review")
    @PreAuthorize("hasRole('TECHNICAL_REVIEWER')")
    public ResponseEntity<?> completeTechnicalReview(@PathVariable UUID id, @Valid @RequestBody CompleteReviewRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application app = applicationService.completeTechnicalReview(id, principal, request.notes());
        return ResponseEntity.ok(Map.of("message", "Technical review completed.", "status", app.getStatus().name()));
    }


    @PostMapping("/{id}/review/request-info")
    @PreAuthorize("hasAnyRole('TECHNICAL_REVIEWER', 'LEGAL_OFFICER', 'FIT_AND_PROPER_OFFICER')")
    public ResponseEntity<?> requestAdditionalInfo(@PathVariable UUID id, @Valid @RequestBody RequestAdditionalInfoRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        applicationService.requestAdditionalInfo(id, principal, request);
        return ResponseEntity.ok(Map.of("message", "Additional information requested.", "infoRequested", request.infoRequested()));
    }

    @PostMapping("/{id}/additional-info/respond")
    @PreAuthorize("hasRole('APPLICANT')")
    public ResponseEntity<?> respondToAdditionalInfo(@PathVariable UUID id, @RequestBody Map<String, Object> body, @AuthenticationPrincipal PortalUserPrincipal principal) {
        UUID returnToState = body.get("returnToState") != null ? UUID.fromString(body.get("returnToState").toString()) : null;
        String responseNotes = body.get("responseNotes") != null ? body.get("responseNotes").toString() : null;

        Application app = applicationService.respondToAdditionalInfo(id, principal,
                returnToState != null ? ApplicationStatus.valueOf(returnToState.toString()) : null, responseNotes);
        return ResponseEntity.ok(Map.of("message", "Response recorded.", "status", app.getStatus().name()));
    }


    @PostMapping("/{id}/start-legal-review")
    @PreAuthorize("hasRole('LEGAL_OFFICER')")
    public ResponseEntity<?> startLegalReview(@PathVariable UUID id, @RequestBody(required = false) StartReviewRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        String notes = request != null ? request.notes() : null;
        applicationService.startLegalReview(id, principal, notes);
        return ResponseEntity.ok(Map.of("message", "Legal review started."));
    }

    @PostMapping("/{id}/complete-legal-review")
    @PreAuthorize("hasRole('LEGAL_OFFICER')")
    public ResponseEntity<?> completeLegalReview(@PathVariable UUID id, @Valid @RequestBody CompleteReviewRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application app = applicationService.completeLegalReview(id, principal, request.notes());
        return ResponseEntity.ok(Map.of("message", "Legal review completed.", "status", app.getStatus().name()));
    }


    @PostMapping("/{id}/start-committee-deliberation")
    @PreAuthorize("hasAnyRole('ADMIN', 'LICENSING_COMMITTEE')")
    public ResponseEntity<?> startCommitteeDeliberation(@PathVariable UUID id, @RequestBody(required = false) StartCommitteeDeliberationRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        String notes = request != null ? request.notes() : null;
        applicationService.startCommitteeDeliberation(id, principal, notes);
        return ResponseEntity.ok(Map.of("message", "Committee deliberation started."));
    }

    @PostMapping("/{id}/grant-approval-in-principle")
    @PreAuthorize("hasRole('LICENSING_COMMITTEE')")
    public ResponseEntity<?> grantApprovalInPrinciple(@PathVariable UUID id, @Valid @RequestBody GrantAipRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application app = applicationService.grantApprovalInPrinciple(id, principal, request);
        return ResponseEntity.ok(Map.of(
                "message", "Approval in Principle granted.",
                "status", app.getStatus().name(),
                "aipGrantedAt", app.getAipGrantedAt().toString(),
                "aipExpiresAt", app.getAipExpiresAt().toString(),
                "conditionsCount", app.getConditions().size()
        ));
    }

    @PostMapping("/{id}/deny-approval-in-principle")
    @PreAuthorize("hasRole('LICENSING_COMMITTEE')")
    public ResponseEntity<?> denyApprovalInPrinciple(@PathVariable UUID id, @Valid @RequestBody DenyAipRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application app = applicationService.denyApprovalInPrinciple(id, principal, request.reason());
        return ResponseEntity.ok(Map.of(
                "message", "Approval in Principle denied.",
                "status", app.getStatus().name()
        ));
    }

    @PostMapping("/{id}/approval/reject")
    @PreAuthorize("hasAnyRole('COMPLIANCE_OFFICER', 'ADMIN')")
    public ResponseEntity<?> rejectApplication(@PathVariable UUID id, @Valid @RequestBody TransitionRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application app = applicationService.transitionState(id, ApplicationStatus.REJECTED, principal, request.reason);
        return ResponseEntity.ok(Map.of("message", "Application rejected.", "status", app.getStatus().name()));
    }


    @GetMapping("/{id}/conditions")
    public ResponseEntity<List<LicenseConditionResponse>> getLicenseConditions(@PathVariable UUID id) {
        return ResponseEntity.ok(applicationService.getLicenseConditions(id));
    }

    @PostMapping("/{id}/conditions")
    @PreAuthorize("hasAnyRole('LICENSING_COMMITTEE', 'ADMIN')")
    public ResponseEntity<LicenseConditionResponse> addLicenseCondition(@PathVariable UUID id, @Valid @RequestBody AddConditionRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        LicenseConditionResponse condition = applicationService.addLicenseCondition(id, request, principal);
        return ResponseEntity.ok(condition);
    }

    @PatchMapping("/{id}/conditions/{conditionId}/fulfill")
    @PreAuthorize("hasRole('INSPECTION_OFFICER')")
    public ResponseEntity<LicenseConditionResponse> fulfillLicenseCondition(@PathVariable UUID id, @PathVariable UUID conditionId, @RequestBody FulfillConditionRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        LicenseConditionResponse condition = applicationService.fulfillLicenseCondition(id, conditionId, request, principal);
        return ResponseEntity.ok(condition);
    }


    @PostMapping("/{id}/request-inspection")
    @PreAuthorize("hasRole('INSPECTION_OFFICER')")
    public ResponseEntity<?> requestInspection(@PathVariable UUID id, @Valid @RequestBody ScheduleInspectionRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        applicationService.requestInspection(id, principal, request);
        return ResponseEntity.ok(Map.of("message", "Inspection scheduled.", "scheduledDate", request.scheduledDate().toString()));
    }

    @PostMapping("/{id}/submit-inspection-report")
    @PreAuthorize("hasRole('INSPECTION_OFFICER')")
    public ResponseEntity<?> submitInspectionReport(@PathVariable UUID id, @Valid @RequestBody SubmitInspectionReportRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        InspectionReportResponse report = applicationService.submitInspectionReport(id, principal, request);
        return ResponseEntity.ok(Map.of(
                "message", "Inspection report submitted.",
                "outcome", report.overallOutcome(),
                "status", "PASSED".equals(report.overallOutcome()) ? ApplicationStatus.LICENSE_FEE_PENDING.name() : ApplicationStatus.INSPECTION_FAILED.name()
        ));
    }


    @PostMapping("/{id}/confirm-fee-payment")
    @PreAuthorize("hasAnyRole('COMPLIANCE_OFFICER', 'ADMIN')")
    public ResponseEntity<?> confirmFeePayment(@PathVariable UUID id, @Valid @RequestBody ConfirmFeePaymentRequest request, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application app = applicationService.confirmFeePayment(id, principal, request);
        return ResponseEntity.ok(Map.of(
                "message", "Fee payment confirmed.",
                "licenseFeePaidAt", app.getLicenseFeePaidAt().toString()
        ));
    }


    @PostMapping("/{id}/issue-license")
    @PreAuthorize("hasRole('GOVERNOR_DELEGATE')")
    public ResponseEntity<?> issueLicense(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal) {
        Application app = applicationService.issueLicense(id, principal);
        return ResponseEntity.ok(Map.of(
                "message", "License issued successfully.",
                "status", app.getStatus().name(),
                "licenseNumber", app.getLicenseNumber(),
                "licenseIssuedAt", app.getLicenseIssuedAt().toString()
        ));
    }

    @GetMapping("/{id}/decision-summary")
    @PreAuthorize("hasAnyRole('TECHNICAL_REVIEWER', 'CASE_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getDecisionSummary(@PathVariable UUID id, @AuthenticationPrincipal PortalUserPrincipal principal) {
        return ResponseEntity.ok(applicationService.getDecisionSummary(id));
    }


    public static class CreateDraftRequest {
        @jakarta.validation.constraints.NotBlank
        public String proposedName;
        @jakarta.validation.constraints.NotNull
        public rw.bnr.licensing.domain.enums.LicenseType licenseType;
        @jakarta.validation.constraints.NotNull
        public Long proposedCapitalRwf;
    }

    public static class TransitionRequest {
        public String reason;
        public UUID caseManagerId;
    }
}