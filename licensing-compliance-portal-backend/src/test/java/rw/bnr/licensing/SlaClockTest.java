package rw.bnr.licensing;

import org.junit.jupiter.api.Test;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.service.SlaClockService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

public class SlaClockTest {

    private final SlaClockService slaClockService = new SlaClockService();

    @Test
    public void testSlaClockLifecycle() {
        Application app = new Application();
        app.setSlaWorkingDaysTarget(90);
        
        // Start clock
        slaClockService.startClock(app);
        assertNotNull(app.getSlaClockStartedAt());
        assertEquals(0, app.getSlaWorkingDaysUsed());
        assertNull(app.getSlaClockPausedAt());
        
        // Manually set started at to 5 days ago (assume no weekends for simplicity of this test logic)
        // Wait, calculateWorkingDays skips weekends. If we subtract 7 days, it's exactly 5 working days.
        app.setSlaClockStartedAt(Instant.now().minus(7, ChronoUnit.DAYS));
        
        // Pause clock
        slaClockService.pauseClock(app, "Awaiting applicant response");
        assertNotNull(app.getSlaClockPausedAt());
        assertNull(app.getSlaClockStartedAt());
        assertEquals("Awaiting applicant response", app.getSlaPausedReason());
        // Since we went back 7 days, it should be 5 working days (1 full week)
        assertTrue(app.getSlaWorkingDaysUsed() == 4 || app.getSlaWorkingDaysUsed() == 5);
        
        // Resume clock
        slaClockService.resumeClock(app);
        assertNull(app.getSlaClockPausedAt());
        assertNull(app.getSlaPausedReason());
        assertNotNull(app.getSlaClockStartedAt());
        
        // Verify remaining days
        assertTrue(slaClockService.getWorkingDaysRemaining(app) <= 86);
    }
}
