package rw.bnr.licensing;

import org.junit.jupiter.api.Test;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.exception.InvalidStateTransitionException;
import rw.bnr.licensing.service.StateMachineService;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit tests for the StateMachineService.
 *
 * Covers:
 * - All valid transitions (happy path)
 * - Invalid / illegal transitions
 * - Terminal state immutability (LICENSED, REJECTED, WITHDRAWN, AIP_EXPIRED cannot transition anywhere)
 * - ADDITIONAL_INFO_REQUESTED return paths
 * - Withdrawal timing rules (only from DRAFT/SUBMITTED)
 */
public class StateMachineTest {

    private final StateMachineService stateMachineService = new StateMachineService();

    // =========================================================================
    // VALID TRANSITIONS
    // =========================================================================

    @Test
    void draftToNameApprovalPending_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.DRAFT, ApplicationStatus.NAME_APPROVAL_PENDING));
    }

    @Test
    void draftToWithdrawn_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.DRAFT, ApplicationStatus.WITHDRAWN));
    }

    @Test
    void nameApprovalPendingToNameApproved_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.NAME_APPROVAL_PENDING, ApplicationStatus.NAME_APPROVED));
    }

    @Test
    void nameApprovalPendingBackToDraft_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.NAME_APPROVAL_PENDING, ApplicationStatus.DRAFT));
    }

    @Test
    void nameApprovedToSubmitted_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.NAME_APPROVED, ApplicationStatus.SUBMITTED));
    }

    @Test
    void submittedToCompletenessCheck_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.COMPLETENESS_CHECK));
    }

    @Test
    void submittedToWithdrawn_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.WITHDRAWN));
    }

    @Test
    void completenessCheckToIncomplete_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.COMPLETENESS_CHECK, ApplicationStatus.INCOMPLETE));
    }

    @Test
    void completenessCheckToCaseAssigned_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.COMPLETENESS_CHECK, ApplicationStatus.CASE_ASSIGNED));
    }

    @Test
    void incompleteToSubmitted_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.INCOMPLETE, ApplicationStatus.SUBMITTED));
    }

    @Test
    void caseAssignedToFitAndProper_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.CASE_ASSIGNED, ApplicationStatus.FIT_AND_PROPER_ASSESSMENT));
    }

    @Test
    void fitAndProperToAdditionalInfoRequested_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.FIT_AND_PROPER_ASSESSMENT, ApplicationStatus.ADDITIONAL_INFO_REQUESTED));
    }

    @Test
    void fitAndProperToTechnicalReview_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.FIT_AND_PROPER_ASSESSMENT, ApplicationStatus.TECHNICAL_REVIEW));
    }

    @Test
    void technicalReviewToAdditionalInfoRequested_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.TECHNICAL_REVIEW, ApplicationStatus.ADDITIONAL_INFO_REQUESTED));
    }

    @Test
    void technicalReviewToLegalReview_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.TECHNICAL_REVIEW, ApplicationStatus.LEGAL_REVIEW));
    }

    @Test
    void legalReviewToAdditionalInfoRequested_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.LEGAL_REVIEW, ApplicationStatus.ADDITIONAL_INFO_REQUESTED));
    }

    @Test
    void legalReviewToCommitteeDeliberation_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.LEGAL_REVIEW, ApplicationStatus.COMMITTEE_DELIBERATION));
    }

    @Test
    void committeeToApprovalInPrinciple_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.COMMITTEE_DELIBERATION, ApplicationStatus.APPROVAL_IN_PRINCIPLE));
    }

    @Test
    void committeeToRejected_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.COMMITTEE_DELIBERATION, ApplicationStatus.REJECTED));
    }

    @Test
    void approvalInPrincipleToOrganizationPeriod_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.APPROVAL_IN_PRINCIPLE, ApplicationStatus.ORGANIZATION_PERIOD));
    }

    @Test
    void organizationPeriodToPreLicenseInspection_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.ORGANIZATION_PERIOD, ApplicationStatus.PRE_LICENSE_INSPECTION));
    }

    @Test
    void organizationPeriodToAipExpired_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.ORGANIZATION_PERIOD, ApplicationStatus.AIP_EXPIRED));
    }

    @Test
    void inspectionToInspectionFailed_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.PRE_LICENSE_INSPECTION, ApplicationStatus.INSPECTION_FAILED));
    }

    @Test
    void inspectionToLicenseFeePending_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.PRE_LICENSE_INSPECTION, ApplicationStatus.LICENSE_FEE_PENDING));
    }

    @Test
    void inspectionFailedToOrganizationPeriod_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.INSPECTION_FAILED, ApplicationStatus.ORGANIZATION_PERIOD));
    }

    @Test
    void licenseFeePendingToLicensed_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.LICENSE_FEE_PENDING, ApplicationStatus.LICENSED));
    }

    // ADDITIONAL_INFO_REQUESTED return paths — all three are valid
    @Test
    void additionalInfoToFitAndProper_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.ADDITIONAL_INFO_REQUESTED, ApplicationStatus.FIT_AND_PROPER_ASSESSMENT));
    }

    @Test
    void additionalInfoToTechnicalReview_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.ADDITIONAL_INFO_REQUESTED, ApplicationStatus.TECHNICAL_REVIEW));
    }

    @Test
    void additionalInfoToLegalReview_isValid() {
        assertDoesNotThrow(() ->
            stateMachineService.assertTransition(ApplicationStatus.ADDITIONAL_INFO_REQUESTED, ApplicationStatus.LEGAL_REVIEW));
    }

    // =========================================================================
    // INVALID TRANSITIONS
    // =========================================================================

    @Test
    void draftDirectlyToSubmitted_isInvalid() {
        assertThrows(InvalidStateTransitionException.class, () ->
            stateMachineService.assertTransition(ApplicationStatus.DRAFT, ApplicationStatus.SUBMITTED));
    }

    @Test
    void draftDirectlyToLicensed_isInvalid() {
        assertThrows(InvalidStateTransitionException.class, () ->
            stateMachineService.assertTransition(ApplicationStatus.DRAFT, ApplicationStatus.LICENSED));
    }

    @Test
    void submittedDirectlyToTechnicalReview_isInvalid() {
        assertThrows(InvalidStateTransitionException.class, () ->
            stateMachineService.assertTransition(ApplicationStatus.SUBMITTED, ApplicationStatus.TECHNICAL_REVIEW));
    }

    @Test
    void technicalReviewDirectlyToCommittee_isInvalid() {
        assertThrows(InvalidStateTransitionException.class, () ->
            stateMachineService.assertTransition(ApplicationStatus.TECHNICAL_REVIEW, ApplicationStatus.COMMITTEE_DELIBERATION));
    }

    @Test
    void approvalInPrincipleDirectlyToLicensed_isInvalid() {
        assertThrows(InvalidStateTransitionException.class, () ->
            stateMachineService.assertTransition(ApplicationStatus.APPROVAL_IN_PRINCIPLE, ApplicationStatus.LICENSED));
    }

    @Test
    void withdrawnCannotTransitionToAnywhere_isInvalid() {
        // WITHDRAWN is terminal — no onward transition should be allowed
        for (ApplicationStatus target : ApplicationStatus.values()) {
            if (target != ApplicationStatus.WITHDRAWN) {
                assertThrows(InvalidStateTransitionException.class, () ->
                    stateMachineService.assertTransition(ApplicationStatus.WITHDRAWN, target),
                    "Expected exception for WITHDRAWN -> " + target);
            }
        }
    }

    @Test
    void committeeDeliberationToWithdrawn_isInvalid() {
        // WITHDRAWN is only valid from DRAFT or SUBMITTED — not from committee stage
        assertThrows(InvalidStateTransitionException.class, () ->
            stateMachineService.assertTransition(ApplicationStatus.COMMITTEE_DELIBERATION, ApplicationStatus.WITHDRAWN));
    }

    @Test
    void approvalInPrincipleToWithdrawn_isInvalid() {
        // Post-AIP withdrawal is not allowed — AIP expiry handles non-completion
        assertThrows(InvalidStateTransitionException.class, () ->
            stateMachineService.assertTransition(ApplicationStatus.APPROVAL_IN_PRINCIPLE, ApplicationStatus.WITHDRAWN));
    }

    // =========================================================================
    // TERMINAL STATE IMMUTABILITY
    // Every terminal state must reject ALL transitions, including self-transitions
    // =========================================================================

    @Test
    void licensedIsTerminal_noTransitionAllowed() {
        for (ApplicationStatus target : ApplicationStatus.values()) {
            assertThrows(InvalidStateTransitionException.class, () ->
                stateMachineService.assertTransition(ApplicationStatus.LICENSED, target),
                "Expected LICENSED to reject transition to " + target);
        }
    }

    @Test
    void rejectedIsTerminal_noTransitionAllowed() {
        for (ApplicationStatus target : ApplicationStatus.values()) {
            assertThrows(InvalidStateTransitionException.class, () ->
                stateMachineService.assertTransition(ApplicationStatus.REJECTED, target),
                "Expected REJECTED to reject transition to " + target);
        }
    }

    @Test
    void withdrawnIsTerminal_noTransitionAllowed() {
        for (ApplicationStatus target : ApplicationStatus.values()) {
            assertThrows(InvalidStateTransitionException.class, () ->
                stateMachineService.assertTransition(ApplicationStatus.WITHDRAWN, target),
                "Expected WITHDRAWN to reject transition to " + target);
        }
    }

    @Test
    void aipExpiredIsTerminal_noTransitionAllowed() {
        for (ApplicationStatus target : ApplicationStatus.values()) {
            assertThrows(InvalidStateTransitionException.class, () ->
                stateMachineService.assertTransition(ApplicationStatus.AIP_EXPIRED, target),
                "Expected AIP_EXPIRED to reject transition to " + target);
        }
    }
}
