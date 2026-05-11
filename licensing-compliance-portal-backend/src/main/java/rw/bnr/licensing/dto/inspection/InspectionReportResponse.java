package rw.bnr.licensing.dto.inspection;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record InspectionReportResponse(
    UUID id,
    UUID applicationId,
    String inspectionOfficerName,
    LocalDate scheduledDate,
    LocalDate conductedDate,
    Boolean premisesVerified,
    Boolean capitalVerified,
    Long capitalAmountRwf,
    Boolean itSystemsVerified,
    Boolean amlFrameworkOk,
    Boolean staffingAdequate,
    Boolean policyManualsOk,
    String overallOutcome,
    String findings,
    Instant createdAt
) {}