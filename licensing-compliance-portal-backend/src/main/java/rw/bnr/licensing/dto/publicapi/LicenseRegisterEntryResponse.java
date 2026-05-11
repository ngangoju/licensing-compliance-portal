package rw.bnr.licensing.dto.publicapi;

import rw.bnr.licensing.domain.enums.LicenseType;

import java.time.LocalDate;

public record LicenseRegisterEntryResponse(
        String licenseNumber,
        String institutionName,
        LicenseType licenseType,
        LocalDate licensedAt,
        String status
) {
}
