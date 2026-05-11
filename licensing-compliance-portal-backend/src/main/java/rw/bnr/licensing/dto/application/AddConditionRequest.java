package rw.bnr.licensing.dto.application;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

public record AddConditionRequest(
    @NotBlank String conditionText,
    @NotBlank String category,
    Instant dueDate
) {}