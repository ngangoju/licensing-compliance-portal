package rw.bnr.licensing.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rw.bnr.licensing.domain.entity.InspectionReport;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InspectionReportRepository extends JpaRepository<InspectionReport, UUID> {
    Optional<InspectionReport> findByApplicationId(UUID applicationId);
}