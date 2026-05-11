package rw.bnr.licensing.dto.review;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record RequestAdditionalInfoRequest(
    List<String> infoRequested,
    String reason,
    UUID returnToState
) {}