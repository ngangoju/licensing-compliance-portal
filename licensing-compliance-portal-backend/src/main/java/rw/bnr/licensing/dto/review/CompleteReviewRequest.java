package rw.bnr.licensing.dto.review;

import jakarta.validation.constraints.NotBlank;

public record CompleteReviewRequest(
    @NotBlank String notes
) {}