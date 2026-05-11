package rw.bnr.licensing.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.bnr.licensing.domain.entity.ApplicationDocument;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, UUID> {

    List<ApplicationDocument> findByApplicationIdOrderByDocumentTypeAscVersionDesc(UUID applicationId);

    List<ApplicationDocument> findByApplicationIdAndDocumentTypeOrderByVersionDesc(UUID applicationId, String documentType);

    Optional<ApplicationDocument> findByIdAndApplicationId(UUID id, UUID applicationId);

    Optional<ApplicationDocument> findFirstByApplicationIdAndDocumentTypeAndCurrentTrue(UUID applicationId, String documentType);
}
