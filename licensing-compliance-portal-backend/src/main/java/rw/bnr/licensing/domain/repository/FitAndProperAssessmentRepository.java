package rw.bnr.licensing.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.entity.FitAndProperAssessment;

import java.util.List;
import java.util.UUID;

@Repository
public interface FitAndProperAssessmentRepository extends JpaRepository<FitAndProperAssessment, UUID> {
    List<FitAndProperAssessment> findAllByApplication(Application application);
}
