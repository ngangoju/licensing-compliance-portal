package rw.bnr.licensing.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import rw.bnr.licensing.domain.entity.AuditEntry;

import java.util.List;
import java.util.UUID;

public interface AuditEntryRepository extends JpaRepository<AuditEntry, UUID> {

    List<AuditEntry> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);

    java.util.Optional<AuditEntry> findFirstByApplicationIdAndActionOrderByCreatedAtDesc(UUID applicationId, rw.bnr.licensing.domain.enums.AuditAction action);
}
