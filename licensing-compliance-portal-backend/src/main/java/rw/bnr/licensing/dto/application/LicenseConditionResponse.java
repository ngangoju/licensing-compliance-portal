package rw.bnr.licensing.dto.application;

import java.time.Instant;
import java.util.UUID;

public record LicenseConditionResponse(
    UUID id,
    String conditionText,
    String category,
    boolean fulfilled,
    Instant fulfilledAt,
    String fulfilledByName,
    String fulfillmentNote,
    UUID fulfillmentDocumentId,
    Instant dueDate,
    Instant createdAt
) {}