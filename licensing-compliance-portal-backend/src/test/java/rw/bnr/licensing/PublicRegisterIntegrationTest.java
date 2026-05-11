package rw.bnr.licensing;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicRegisterIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void publicRegisterReturnsLicensedInstitutionWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/public/license-register"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].licenseNumber").value("BNR/FB/2024/001"))
                .andExpect(jsonPath("$[0].institutionName").value("Kigali Forex Bureau Ltd"))
                .andExpect(jsonPath("$[0].licenseType").value("FOREX_BUREAU"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
    }
}
