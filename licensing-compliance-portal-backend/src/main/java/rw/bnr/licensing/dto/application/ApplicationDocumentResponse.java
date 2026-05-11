package rw.bnr.licensing.dto.application;

import rw.bnr.licensing.domain.enums.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record ApplicationDocumentResponse(
        UUID id,
        String documentType,
        String originalName,
        String mimeType,
        Integer fileSizeBytes,
        Integer version,
        boolean current,
        ApplicationStatus uploadStage,
        String uploadedByName,
        Instant createdAt
) {
}
