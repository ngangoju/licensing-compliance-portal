package rw.bnr.licensing.dto.inspection;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SubmitInspectionReportRequest(
    @NotNull LocalDate conductedDate,
    @NotNull Boolean premisesVerified,
    @NotNull Boolean capitalVerified,
    Long capitalAmountRwf,
    @NotNull Boolean itSystemsVerified,
    @NotNull Boolean amlFrameworkOk,
    @NotNull Boolean staffingAdequate,
    @NotNull Boolean policyManualsOk,
    @NotBlank String overallOutcome,
    String findings
) {}