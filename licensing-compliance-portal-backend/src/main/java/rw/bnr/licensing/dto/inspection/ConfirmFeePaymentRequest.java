package rw.bnr.licensing.dto.inspection;

import jakarta.validation.constraints.NotNull;

public record ConfirmFeePaymentRequest(
    @NotNull Long amountRwf,
    String paymentReference
) {}