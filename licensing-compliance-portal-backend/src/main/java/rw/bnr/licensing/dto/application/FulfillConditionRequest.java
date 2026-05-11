package rw.bnr.licensing.dto.application;

import java.util.UUID;

public record FulfillConditionRequest(
    UUID documentId,
    String fulfillmentNote
) {}