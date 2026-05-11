package rw.bnr.licensing.dto.committee;

import jakarta.validation.constraints.NotBlank;

public record DenyAipRequest(
    @NotBlank String reason
) {}