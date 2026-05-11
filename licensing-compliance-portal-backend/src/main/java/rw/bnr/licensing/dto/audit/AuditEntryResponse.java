package rw.bnr.licensing.dto.audit;

import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.domain.enums.UserRole;

import java.time.Instant;
import java.util.UUID;

public record AuditEntryResponse(
        UUID id,
        UUID actorId,
        String actorName,
        UserRole actorRole,
        AuditAction action,
        String description,
        Instant createdAt
) {
}
