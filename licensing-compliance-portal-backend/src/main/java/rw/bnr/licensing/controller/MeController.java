package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import rw.bnr.licensing.dto.user.MeResponse;
import rw.bnr.licensing.security.PortalUserPrincipal;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
@Tag(name = "Current User", description = "Current authenticated user profile")
public class MeController {

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get the currently authenticated user")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal PortalUserPrincipal principal) {
        return ResponseEntity.ok(new MeResponse(
                principal.getId().toString(),
                principal.getUsername(),
                principal.getRole(),
                principal.getFullName(),
                principal.getOrganisation()
        ));
    }
}
