package rw.bnr.licensing.service;

import org.springframework.stereotype.Service;
import rw.bnr.licensing.domain.entity.Application;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class SlaClockService {

    public void startClock(Application application) {
        if (application.getSlaClockStartedAt() == null && application.getSlaClockPausedAt() == null) {
            application.setSlaClockStartedAt(Instant.now());
        }
    }

    public void pauseClock(Application application, String reason) {
        if (application.getSlaClockStartedAt() != null && application.getSlaClockPausedAt() == null) {
            Instant now = Instant.now();
            int daysElapsed = calculateWorkingDays(application.getSlaClockStartedAt(), now);
            application.setSlaWorkingDaysUsed(application.getSlaWorkingDaysUsed() + daysElapsed);
            application.setSlaClockPausedAt(now);
            application.setSlaClockStartedAt(null); // Clear start so we don't double count
            application.setSlaPausedReason(reason);
        }
    }

    public void resumeClock(Application application) {
        if (application.getSlaClockPausedAt() != null) {
            application.setSlaClockPausedAt(null);
            application.setSlaPausedReason(null);
            application.setSlaClockStartedAt(Instant.now());
        }
    }

    public int getWorkingDaysUsed(Application application) {
        int used = application.getSlaWorkingDaysUsed();
        if (application.getSlaClockStartedAt() != null && application.getSlaClockPausedAt() == null) {
            used += calculateWorkingDays(application.getSlaClockStartedAt(), Instant.now());
        }
        return used;
    }

    public int getWorkingDaysRemaining(Application application) {
        return application.getSlaWorkingDaysTarget() - getWorkingDaysUsed(application);
    }

    private int calculateWorkingDays(Instant start, Instant end) {
        if (start == null || end == null || start.isAfter(end)) return 0;
        
        ZonedDateTime zStart = start.atZone(ZoneId.of("Africa/Kigali"));
        ZonedDateTime zEnd = end.atZone(ZoneId.of("Africa/Kigali"));
        
        int workingDays = 0;
        ZonedDateTime current = zStart;
        while (current.isBefore(zEnd) || current.toLocalDate().isEqual(zEnd.toLocalDate())) {
            if (current.getDayOfWeek() != DayOfWeek.SATURDAY && current.getDayOfWeek() != DayOfWeek.SUNDAY) {
                workingDays++;
            }
            current = current.plus(1, ChronoUnit.DAYS);
            // If we've surpassed the end time on the exact same day, break
            if (current.isAfter(zEnd) && !current.toLocalDate().isEqual(zEnd.toLocalDate())) {
                break;
            }
        }
        // Exclude the starting day if it was just the beginning of counting to match standard exclusive/inclusive bounds, 
        // but for simplicity, we count every weekday touched.
        return Math.max(0, workingDays - 1); // Simple approximation
    }
}
