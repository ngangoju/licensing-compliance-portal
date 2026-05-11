package rw.bnr.licensing.domain.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.enums.ApplicationStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    @EntityGraph(attributePaths = {
            "applicant",
            "caseManager",
            "complianceOfficer",
            "technicalReviewer",
            "legalOfficer",
            "inspectionOfficer",
            "licenseIssuedBy",
            "aipGrantedBy",
            "infoRequestedItems"
    })
    Optional<Application> findById(UUID id);

    List<Application> findAllByStatusOrderByLicenseIssuedAtDesc(ApplicationStatus status);

    org.springframework.data.domain.Page<Application> findAllByStatusOrderByLicenseIssuedAtDesc(ApplicationStatus status, org.springframework.data.domain.Pageable pageable);

    List<Application> findAllByApplicantOrderByUpdatedAtDesc(User applicant);

    List<Application> findByStatusNotOrderByUpdatedAtDesc(ApplicationStatus status);

    List<Application> findByStatusInOrderByUpdatedAtDesc(List<ApplicationStatus> statuses);

    List<Application> findByStatusInAndAipExpiresAtBefore(List<ApplicationStatus> statuses, java.time.Instant now);
}
