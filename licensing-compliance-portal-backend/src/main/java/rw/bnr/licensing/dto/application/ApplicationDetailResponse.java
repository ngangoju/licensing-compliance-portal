package rw.bnr.licensing.dto.application;

import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.domain.enums.LicenseType;

import java.time.Instant;
import java.util.UUID;

public record ApplicationDetailResponse(
        UUID id,
        String referenceNumber,
        LicenseType licenseType,
        String institutionName,
        String proposedName,
        ApplicationStatus status,
        Long proposedCapitalRwf,
        String registeredCountry,
        boolean foreignInstitution,
        String homeSupervisorName,
        String homeSupervisorEmail,
        String applicantName,
        String applicantEmail,
        Instant submittedAt,
        String licenseNumber,
        Instant licenseIssuedAt,
        Integer slaWorkingDaysTarget,
        Integer slaWorkingDaysUsed,
        Instant slaClockStartedAt,
        Instant slaClockPausedAt,
        String slaPausedReason,
        // Phase 5 fields
        String technicalReviewNotes,
        String legalReviewNotes,
        String rejectionReason,
        Instant aipGrantedAt,
        Instant aipExpiresAt,
        Instant organizationDeadline,
        String caseManagerName,
        String technicalReviewerName,
        String legalOfficerName,
        // Phase 5 fields
        String infoRequestedReason,
        java.util.List<String> infoRequestedItems,
        // Phase 6 fields
        String inspectionOfficerName,
        String inspectionOutcome,
        Instant licenseFeePaidAt,
        String licenseIssuedByName
) {
}