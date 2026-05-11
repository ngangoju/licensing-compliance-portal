package rw.bnr.licensing;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Authorization integration tests.
 *
 * Verifies that role-based access control is enforced at the API level —
 * not just in the frontend. Each test logs in as a specific role and
 * attempts to access an endpoint that role is not permitted to use,
 * asserting a 403 Forbidden response with the correct error code.
 *
 * Covers the requirement: "Role enforcement must live in the backend.
 * A user who bypasses the frontend must still be denied."
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    // Application IDs from the test seed data
    private static final String LICENSED_APP_ID  = "d786d4c9-f4ba-478f-806a-30c824ff54b6";
    private static final String ACTIVE_APP_ID     = "7a7f54e3-ec9d-4d73-83f1-c51fbf989824";

    // =========================================================================
    // APPLICANT role — cannot access BNR-internal endpoints
    // =========================================================================

    @Test
    void applicant_cannotAccessQueue() throws Exception {
        String token = login("applicant@kcb.rw");
        mockMvc.perform(get("/api/applications/queue")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void applicant_cannotStartCompletenessCheck() throws Exception {
        String token = login("applicant@kcb.rw");
        mockMvc.perform(post("/api/applications/{id}/start-completeness-check", ACTIVE_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void applicant_cannotIssueLicense() throws Exception {
        String token = login("applicant@kcb.rw");
        mockMvc.perform(post("/api/applications/{id}/issue-license", LICENSED_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void applicant_cannotGrantApprovalInPrinciple() throws Exception {
        String token = login("applicant@kcb.rw");
        mockMvc.perform(post("/api/applications/{id}/grant-approval-in-principle", ACTIVE_APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"test\",\"conditions\":[{\"conditionText\":\"test\",\"category\":\"test\"}]}")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void applicant_cannotAccessAdminUsers() throws Exception {
        String token = login("applicant@kcb.rw");
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // TECHNICAL_REVIEWER role — cannot perform actions outside review scope
    // =========================================================================

    @Test
    void technicalReviewer_cannotIssueLicense() throws Exception {
        String token = login("reviewer@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/issue-license", LICENSED_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void technicalReviewer_cannotStartCompletenessCheck() throws Exception {
        String token = login("reviewer@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/start-completeness-check", ACTIVE_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void technicalReviewer_cannotGrantApprovalInPrinciple() throws Exception {
        String token = login("reviewer@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/grant-approval-in-principle", ACTIVE_APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"test\",\"conditions\":[{\"conditionText\":\"test\",\"category\":\"test\"}]}")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void technicalReviewer_cannotSubmitInspectionReport() throws Exception {
        String token = login("reviewer@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/submit-inspection-report", ACTIVE_APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"conductedDate\":\"2023-01-01\",\"premisesVerified\":true,\"capitalVerified\":true,\"itSystemsVerified\":true,\"amlFrameworkOk\":true,\"staffingAdequate\":true,\"policyManualsOk\":true,\"overallOutcome\":\"PASSED\"}")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // LICENSING_COMMITTEE role — cannot perform non-committee actions
    // =========================================================================

    @Test
    void licensingCommittee_cannotIssueLicense() throws Exception {
        String token = login("committee@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/issue-license", LICENSED_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void licensingCommittee_cannotStartCompletenessCheck() throws Exception {
        String token = login("committee@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/start-completeness-check", ACTIVE_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void licensingCommittee_cannotStartTechnicalReview() throws Exception {
        String token = login("committee@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/start-technical-review", ACTIVE_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // GOVERNOR_DELEGATE role — cannot perform review-stage actions
    // =========================================================================

    @Test
    void governorDelegate_cannotApproveName() throws Exception {
        String token = login("governor.delegate@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/approve-name", ACTIVE_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void governorDelegate_cannotStartTechnicalReview() throws Exception {
        String token = login("governor.delegate@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/start-technical-review", ACTIVE_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void governorDelegate_cannotGrantApprovalInPrinciple() throws Exception {
        String token = login("governor.delegate@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/grant-approval-in-principle", ACTIVE_APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"test\",\"conditions\":[{\"conditionText\":\"test\",\"category\":\"test\"}]}")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // AUDITOR role — read-only; cannot trigger any state transition
    // =========================================================================

    @Test
    void auditor_cannotCreateDraft() throws Exception {
        String token = login("auditor@bnr.rw");
        mockMvc.perform(post("/api/applications/draft")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"proposedName\":\"Test Bank\",\"licenseType\":\"COMMERCIAL_BANK\",\"proposedCapitalRwf\":25000000000}")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditor_cannotIssueLicense() throws Exception {
        String token = login("auditor@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/issue-license", LICENSED_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void auditor_cannotStartCompletenessCheck() throws Exception {
        String token = login("auditor@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/start-completeness-check", ACTIVE_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // Unauthenticated — must return 401, not 403 or 500
    // =========================================================================

    @Test
    void unauthenticated_cannotAccessApplicationQueue() throws Exception {
        mockMvc.perform(get("/api/applications/queue"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
    }

    @Test
    void unauthenticated_cannotAccessProtectedEndpoint() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    // =========================================================================
    // COMPLIANCE_OFFICER — can access queue but not issue license
    // =========================================================================

    @Test
    void complianceOfficer_cannotIssueLicense() throws Exception {
        String token = login("compliance@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/issue-license", LICENSED_APP_ID)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void complianceOfficer_cannotGrantApprovalInPrinciple() throws Exception {
        String token = login("compliance@bnr.rw");
        mockMvc.perform(post("/api/applications/{id}/grant-approval-in-principle", ACTIVE_APP_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"test\",\"conditions\":[{\"conditionText\":\"test\",\"category\":\"test\"}]}")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private String login(String email) throws Exception {
        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "Test@1234"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        // Extract accessToken from JSON response
        return body.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }
}
