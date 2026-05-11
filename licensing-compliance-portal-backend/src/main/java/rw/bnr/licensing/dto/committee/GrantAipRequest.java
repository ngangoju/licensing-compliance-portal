package rw.bnr.licensing.dto.committee;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

public record GrantAipRequest(
    @NotEmpty List<ConditionInput> conditions,
    String notes
) {
    public record ConditionInput(
        @NotNull String conditionText,
        @NotNull String category,
        Instant dueDate
    ) {}
}