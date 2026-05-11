package rw.bnr.licensing.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.entity.ApplicationDocument;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.domain.enums.LicenseType;
import rw.bnr.licensing.domain.enums.UserRole;
import rw.bnr.licensing.domain.repository.ApplicationDocumentRepository;
import rw.bnr.licensing.domain.repository.ApplicationRepository;
import rw.bnr.licensing.domain.repository.UserRepository;

import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationRepository applicationRepository;
    private final ApplicationDocumentRepository applicationDocumentRepository;

    public DatabaseSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder,
                          ApplicationRepository applicationRepository,
                          ApplicationDocumentRepository applicationDocumentRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.applicationRepository = applicationRepository;
        this.applicationDocumentRepository = applicationDocumentRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            String encodedPassword = passwordEncoder.encode("Test@1234");

            List<User> seedUsers = List.of(
                    createUser("applicant@kcb.rw", encodedPassword, UserRole.APPLICANT, "Jean Pierre Habimana", "KCB Rwanda Promoters"),
                    createUser("compliance@bnr.rw", encodedPassword, UserRole.COMPLIANCE_OFFICER, "Marie Claire Uwase", "BNR Licensing Dept"),
                    createUser("reviewer@bnr.rw", encodedPassword, UserRole.TECHNICAL_REVIEWER, "Patrick Ndayisenga", "BNR Licensing Dept"),
                    createUser("fp.officer@bnr.rw", encodedPassword, UserRole.FIT_AND_PROPER_OFFICER, "Claudine Mukamana", "BNR Licensing Dept"),
                    createUser("legal@bnr.rw", encodedPassword, UserRole.LEGAL_OFFICER, "Emmanuel Nshimiyimana", "BNR Legal Division"),
                    createUser("inspector@bnr.rw", encodedPassword, UserRole.INSPECTION_OFFICER, "Solange Ingabire", "BNR Examination Dept"),
                    createUser("committee@bnr.rw", encodedPassword, UserRole.LICENSING_COMMITTEE, "Dr. Jennifer Batamuliza", "BNR Board Committee"),
                    createUser("governor.delegate@bnr.rw", encodedPassword, UserRole.GOVERNOR_DELEGATE, "Soraya Hakuziyaremye", "BNR Executive"),
                    createUser("admin@bnr.rw", encodedPassword, UserRole.ADMIN, "Eric Mugisha", "BNR IT Dept"),
                    createUser("auditor@bnr.rw", encodedPassword, UserRole.AUDITOR, "Jeannette Nzeyimana", "BNR Internal Audit"),
                    createUser("casemanager@bnr.rw", encodedPassword, UserRole.CASE_MANAGER, "Alice Mukarwego", "BNR Licensing Dept")
            );

            userRepository.saveAll(seedUsers);
            System.out.println("✅ Seeded test users successfully.");
        }

        // Fix document names if they exist
        List<ApplicationDocument> documents = applicationDocumentRepository.findAll();
        if (!documents.isEmpty()) {
            for (ApplicationDocument doc : documents) {
                if ("BUSINESS_PLAN".equals(doc.getDocumentType())) {
                    doc.setOriginalName("Business_Plan_2026.pdf");
                } else if ("ARTICLES_OF_INCORPORATION".equals(doc.getDocumentType())) {
                    doc.setOriginalName("Articles_of_Incorporation.pdf");
                } else if ("AML_CFT_POLICY".equals(doc.getDocumentType())) {
                    doc.setOriginalName("AML_CFT_Policy_Manual.pdf");
                } else if ("GOVERNANCE_CHARTER".equals(doc.getDocumentType())) {
                    doc.setOriginalName("Governance_Charter.pdf");
                }
            }
            applicationDocumentRepository.saveAll(documents);
            System.out.println("✅ Updated seeded document names to realistic ones.");
        }
    }

    private User createUser(String email, String passwordHash, UserRole role, String fullName, String organisation) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordHash);
        user.setRole(role);
        user.setFullName(fullName);
        user.setOrganisation(organisation);
        user.setActive(true);
        return user;
    }
}
