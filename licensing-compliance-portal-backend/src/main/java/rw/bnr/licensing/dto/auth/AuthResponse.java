package rw.bnr.licensing.dto.auth;

import rw.bnr.licensing.domain.enums.UserRole;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String email,
        UserRole role,
        String fullName,
        String organisation
) {
}
