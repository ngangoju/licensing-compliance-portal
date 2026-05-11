package rw.bnr.licensing.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rw.bnr.licensing.domain.entity.LicenseCondition;

import java.util.List;
import java.util.UUID;

@Repository
public interface LicenseConditionRepository extends JpaRepository<LicenseCondition, UUID> {
    List<LicenseCondition> findByApplicationIdOrderByCreatedAtAsc(UUID applicationId);
}