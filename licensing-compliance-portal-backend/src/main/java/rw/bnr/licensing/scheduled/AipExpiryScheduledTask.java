package rw.bnr.licensing.scheduled;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.domain.repository.ApplicationRepository;
import rw.bnr.licensing.service.AuditService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Component
public class AipExpiryScheduledTask {

    private static final Logger log = LoggerFactory.getLogger(AipExpiryScheduledTask.class);

    private final ApplicationRepository applicationRepository;
    private final AuditService auditService;

    public AipExpiryScheduledTask(ApplicationRepository applicationRepository, AuditService auditService) {
        this.applicationRepository = applicationRepository;
        this.auditService = auditService;
    }

    @Scheduled(cron = "0 0 0 * * *") // Run at midnight every day
    @Transactional
    public void expireOldAips() {
        log.info("Running AIP expiry check...");

        Instant now = Instant.now();

        // Find applications in AIP or Organization Period that have expired
        List<Application> expiredAips = applicationRepository.findByStatusInAndAipExpiresAtBefore(
                List.of(ApplicationStatus.APPROVAL_IN_PRINCIPLE, ApplicationStatus.ORGANIZATION_PERIOD),
                now
        );

        for (Application app : expiredAips) {
            ApplicationStatus fromStatus = app.getStatus();
            app.setStatus(ApplicationStatus.AIP_EXPIRED);
            app.setFinalStatusAt(now);
            applicationRepository.save(app);

            // Create a synthetic principal for the audit
            auditService.record(
                    app.getId(),
                    UUID.fromString("00000000-0000-0000-0000-000000000000"),
                    "SYSTEM",
                    AuditAction.AIP_EXPIRED,
                    "AIP expired automatically. Expired at: " + app.getAipExpiresAt() + ". Current time: " + now,
                    fromStatus.name(),
                    ApplicationStatus.AIP_EXPIRED.name(),
                    "127.0.0.1",
                    "ScheduledTask"
            );

            log.info("Application {} ({}) AIP expired. Was in status: {}",
                    app.getId(), app.getReferenceNumber(), fromStatus);
        }

        if (!expiredAips.isEmpty()) {
            log.info("AIP expiry check completed. {} applications expired.", expiredAips.size());
        } else {
            log.info("AIP expiry check completed. No expired AIPs found.");
        }
    }
}