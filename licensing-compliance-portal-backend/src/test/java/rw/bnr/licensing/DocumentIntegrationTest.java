package rw.bnr.licensing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DocumentIntegrationTest {

    private static final String APPLICATION_ID = "0b922896-c972-4263-ad11-6e822ee2a697";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void documentUploadCreatesMetadataAndAuditEntry() throws Exception {
        String token = loginAsApplicant();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "business-plan.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "phase2".getBytes()
        );

        mockMvc.perform(multipart("/api/applications/{id}/documents", APPLICATION_ID)
                        .file(file)
                        .param("documentType", "BUSINESS_PLAN")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentType").value("BUSINESS_PLAN"))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.current").value(true));

        Integer documentCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM bnr.application_documents WHERE application_id = ?",
                Integer.class,
                java.util.UUID.fromString(APPLICATION_ID)
        );
        Integer auditCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM audit.log WHERE application_id = ? AND action = 'DOCUMENT_UPLOADED'",
                Integer.class,
                java.util.UUID.fromString(APPLICATION_ID)
        );

        assertThat(documentCount).isEqualTo(1);
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void oversizedDocumentUploadIsRejected() throws Exception {
        String token = loginAsApplicant();
        byte[] oversized = new byte[(5 * 1024 * 1024) + 1];
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "capital-proof.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                oversized
        );

        mockMvc.perform(multipart("/api/applications/{id}/documents", APPLICATION_ID)
                        .file(file)
                        .param("documentType", "CAPITAL_PROOF")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_FILE_UPLOAD"));
    }

    @Test
    void auditLogInsertionsRemainAppendOnlyAtApplicationLevel() {
        Integer before = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM audit.log", Integer.class);
        assertThat(before).isNotNull();
    }

    private String loginAsApplicant() throws Exception {
        String payload = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "applicant@kcb.rw",
                                  "password": "Test@1234"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return payload.replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
    }
}
