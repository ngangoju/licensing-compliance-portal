package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.bnr.licensing.domain.entity.FitAndProperAssessment;
import rw.bnr.licensing.security.PortalUserPrincipal;
import rw.bnr.licensing.service.FitAndProperService;

import java.util.AbstractMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/applications/{applicationId}/fit-and-proper")
@Tag(name = "Fit & Proper", description = "Fit and proper assessments management")
public class FitAndProperAssessmentController {

    private final FitAndProperService fitAndProperService;

    public FitAndProperAssessmentController(FitAndProperService fitAndProperService) {
        this.fitAndProperService = fitAndProperService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List all F&P assessments for an application")
    public ResponseEntity<List<FitAndProperAssessmentResponse>> getAssessments(@PathVariable UUID applicationId) {
        List<FitAndProperAssessment> assessments = fitAndProperService.getAssessments(applicationId);
        return ResponseEntity.ok(assessments.stream().map(FitAndProperAssessmentResponse::from).toList());
    }

    @GetMapping("/{assessmentId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get a single F&P assessment")
    public ResponseEntity<FitAndProperAssessmentResponse> getAssessment(@PathVariable UUID applicationId,
                                                              @PathVariable UUID assessmentId) {
        FitAndProperAssessment a = fitAndProperService.getAssessment(assessmentId);
        return ResponseEntity.ok(FitAndProperAssessmentResponse.from(a));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('APPLICANT', 'CASE_MANAGER', 'FIT_AND_PROPER_OFFICER')")
    @Operation(summary = "Add a new individual for F&P assessment")
    public ResponseEntity<FitAndProperAssessmentResponse> createAssessment(
            @PathVariable UUID applicationId,
            @RequestBody CreateAssessmentRequest request,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        FitAndProperService.CreateAssessmentRequest req = new FitAndProperService.CreateAssessmentRequest(
                request.individualName,
                request.individualRole,
                request.shareholdingPct,
                request.nationalId,
                request.nationality
        );
        FitAndProperAssessment a = fitAndProperService.createAssessment(applicationId, req, principal);
        return ResponseEntity.ok(FitAndProperAssessmentResponse.from(a));
    }

    @PutMapping("/{assessmentId}")
    @PreAuthorize("hasRole('FIT_AND_PROPER_OFFICER')")
    @Operation(summary = "Conclude an individual F&P assessment (FIT / NOT_FIT)")
    public ResponseEntity<Map<String, Object>> concludeAssessment(
            @PathVariable UUID applicationId,
            @PathVariable UUID assessmentId,
            @RequestBody ConcludeAssessmentRequest request,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        FitAndProperService.ConcludeAssessmentRequest req = new FitAndProperService.ConcludeAssessmentRequest(
                request.outcome,
                request.outcomeNotes
        );
        fitAndProperService.concludeAssessment(assessmentId, req, principal);
        return ResponseEntity.ok(Map.of("message", "Assessment concluded"));
    }

    @GetMapping("/all-fit")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Check if all individuals have FIT outcome")
    public ResponseEntity<Map<String, Boolean>> areAllAssessmentsFit(@PathVariable UUID applicationId) {
        boolean allFit = fitAndProperService.areAllAssessmentsFit(applicationId);
        return ResponseEntity.ok(Map.of("allFit", allFit));
    }

    public record FitAndProperAssessmentResponse(
            UUID id,
            String individualName,
            String individualRole,
            double shareholdingPct,
            String nationalId,
            String nationality,
            boolean criminalRecordClear,
            boolean financialHistoryClear,
            boolean qualificationsAdequate,
            boolean noConflictOfInterest,
            boolean interviewConducted,
            String interviewDate,
            String interviewNotes,
            String outcome,
            String outcomeNotes,
            String assessedAt
    ) {
        public static FitAndProperAssessmentResponse from(FitAndProperAssessment a) {
            return new FitAndProperAssessmentResponse(
                    a.getId(),
                    a.getIndividualName(),
                    a.getIndividualRole(),
                    a.getShareholdingPct() != null ? a.getShareholdingPct() : 0.0,
                    a.getNationalId() != null ? a.getNationalId() : "",
                    a.getNationality() != null ? a.getNationality() : "",
                    a.getCriminalRecordClear() != null ? a.getCriminalRecordClear() : false,
                    a.getFinancialHistoryClear() != null ? a.getFinancialHistoryClear() : false,
                    a.getQualificationsAdequate() != null ? a.getQualificationsAdequate() : false,
                    a.getNoConflictOfInterest() != null ? a.getNoConflictOfInterest() : false,
                    a.isInterviewConducted(),
                    a.getInterviewDate() != null ? a.getInterviewDate().toString() : "",
                    a.getInterviewNotes() != null ? a.getInterviewNotes() : "",
                    a.getOutcome() != null ? a.getOutcome() : "PENDING",
                    a.getOutcomeNotes() != null ? a.getOutcomeNotes() : "",
                    a.getAssessedAt() != null ? a.getAssessedAt().toString() : ""
            );
        }
    }

    public static class CreateAssessmentRequest {
        public String individualName;
        public String individualRole;
        public Double shareholdingPct;
        public String nationalId;
        public String nationality;
    }

    public static class ConcludeAssessmentRequest {
        public String outcome;
        public String outcomeNotes;
    }
}
