package rw.bnr.licensing.dto.review;

import jakarta.validation.constraints.NotBlank;

public record StartReviewRequest(
    @NotBlank String notes
) {}