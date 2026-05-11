package rw.bnr.licensing.dto.inspection;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ScheduleInspectionRequest(
    @NotNull LocalDate scheduledDate
) {}