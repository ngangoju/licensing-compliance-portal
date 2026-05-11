package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.exception.NotFoundException;
import rw.bnr.licensing.security.PortalUserPrincipal;
import rw.bnr.licensing.service.AuditService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "User and system administration (ADMIN only)")
public class AdminController {

    private final UserRepository userRepository;
    private final AuditService auditService;

    public AdminController(UserRepository userRepository, AuditService auditService) {
        this.userRepository = userRepository;
        this.auditService = auditService;
    }


    @GetMapping("/users")
    @Operation(summary = "List all portal users")
    public ResponseEntity<List<UserSummary>> listUsers() {
        List<UserSummary> users = userRepository.findAll().stream()
                .map(u -> new UserSummary(
                        u.getId(),
                        u.getEmail(),
                        u.getFullName(),
                        u.getRole().name(),
                        u.getOrganisation(),
                        u.isActive(),
                        u.getCreatedAt()
                ))
                .toList();
        return ResponseEntity.ok(users);
    }


    @PatchMapping("/users/{id}/deactivate")
    @Operation(summary = "Deactivate a user account (soft delete)")
    public ResponseEntity<Map<String, Object>> deactivateUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal PortalUserPrincipal principal,
            HttpServletRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));

        if (user.getId().equals(principal.getId())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Administrators cannot deactivate their own account."));
        }

        if (!user.isActive()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "User is already deactivated."));
        }

        user.setActive(false);
        userRepository.save(user);

        // Record the deactivation in the audit log (application_id is null for user-level events)
        auditService.record(
                null,
                principal.getId(),
                principal.getRole().name(),
                AuditAction.USER_DEACTIVATED,
                "User deactivated by admin. Email: " + user.getEmail() + ", Role: " + user.getRole(),
                null,
                null,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        return ResponseEntity.ok(Map.of(
                "message", "User deactivated successfully.",
                "userId", user.getId(),
                "email", user.getEmail()
        ));
    }


    @PatchMapping("/users/{id}/reactivate")
    @Operation(summary = "Reactivate a deactivated user account")
    public ResponseEntity<Map<String, Object>> reactivateUser(
            @PathVariable UUID id,
            @AuthenticationPrincipal PortalUserPrincipal principal,
            HttpServletRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found: " + id));

        if (user.isActive()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "User is already active."));
        }

        user.setActive(true);
        userRepository.save(user);

        auditService.record(
                null,
                principal.getId(),
                principal.getRole().name(),
                AuditAction.USER_CREATED, // reuse closest available action
                "User reactivated by admin. Email: " + user.getEmail(),
                null,
                null,
                request.getRemoteAddr(),
                request.getHeader("User-Agent")
        );

        return ResponseEntity.ok(Map.of(
                "message", "User reactivated successfully.",
                "userId", user.getId()
        ));
    }



    public record UserSummary(
            UUID id,
            String email,
            String fullName,
            String role,
            String organisation,
            boolean active,
            Instant createdAt
    ) {}
}
