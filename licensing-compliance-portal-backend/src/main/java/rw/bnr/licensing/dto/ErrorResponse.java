package rw.bnr.licensing.dto;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(ErrorDetails error) {

    public static ErrorResponse of(String code, String message, Map<String, Object> details) {
        return new ErrorResponse(new ErrorDetails(code, message, details, Instant.now()));
    }

    public record ErrorDetails(
            String code,
            String message,
            Map<String, Object> details,
            Instant timestamp
    ) {
    }
}
