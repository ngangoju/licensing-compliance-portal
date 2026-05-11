package rw.bnr.licensing.service;

import org.springframework.stereotype.Service;
import rw.bnr.licensing.domain.entity.Application;
import rw.bnr.licensing.domain.enums.ApplicationStatus;
import rw.bnr.licensing.domain.repository.ApplicationRepository;
import rw.bnr.licensing.dto.publicapi.LicenseRegisterEntryResponse;

import java.time.ZoneOffset;
import java.util.List;

@Service
public class PublicRegisterService {

    private final ApplicationRepository applicationRepository;

    public PublicRegisterService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    public List<LicenseRegisterEntryResponse> getLicenseRegister() {
        List<Application> applications = applicationRepository.findAllByStatusOrderByLicenseIssuedAtDesc(ApplicationStatus.LICENSED);
        return applications.stream()
                .map(application -> new LicenseRegisterEntryResponse(
                        application.getLicenseNumber(),
                        application.getInstitutionName(),
                        application.getLicenseType(),
                        application.getLicenseIssuedAt() == null
                                ? null
                                : application.getLicenseIssuedAt().atZone(ZoneOffset.UTC).toLocalDate(),
                        "ACTIVE"
                ))
                .toList();
    }

    public org.springframework.data.domain.Page<LicenseRegisterEntryResponse> getLicenseRegister(org.springframework.data.domain.Pageable pageable) {
        return applicationRepository.findAllByStatusOrderByLicenseIssuedAtDesc(ApplicationStatus.LICENSED, pageable)
                .map(application -> new LicenseRegisterEntryResponse(
                        application.getLicenseNumber(),
                        application.getInstitutionName(),
                        application.getLicenseType(),
                        application.getLicenseIssuedAt() == null
                                ? null
                                : application.getLicenseIssuedAt().atZone(ZoneOffset.UTC).toLocalDate(),
                        "ACTIVE"
                ));
    }
}
