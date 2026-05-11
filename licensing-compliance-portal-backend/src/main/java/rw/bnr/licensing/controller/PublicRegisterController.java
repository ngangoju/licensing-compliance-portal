package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rw.bnr.licensing.dto.publicapi.LicenseRegisterEntryResponse;
import rw.bnr.licensing.service.PublicRegisterService;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@Tag(name = "Public Register", description = "Unauthenticated public verification endpoints")
public class PublicRegisterController {

    private final PublicRegisterService publicRegisterService;

    public PublicRegisterController(PublicRegisterService publicRegisterService) {
        this.publicRegisterService = publicRegisterService;
    }

    @GetMapping("/license-register")
    @Operation(summary = "Return the public register of licensed institutions")
    public List<LicenseRegisterEntryResponse> getLicenseRegister() {
        return publicRegisterService.getLicenseRegister();
    }

    @GetMapping("/license-register/paged")
    @Operation(summary = "Return the public register of licensed institutions (paginated)")
    public org.springframework.data.domain.Page<LicenseRegisterEntryResponse> getLicenseRegisterPaged(org.springframework.data.domain.Pageable pageable) {
        return publicRegisterService.getLicenseRegister(pageable);
    }
}
