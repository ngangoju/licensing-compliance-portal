package rw.bnr.licensing.dto.user;

import rw.bnr.licensing.domain.enums.UserRole;

public record MeResponse(
        String id,
        String email,
        UserRole role,
        String fullName,
        String organisation
) {
}
