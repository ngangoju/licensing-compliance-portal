package rw.bnr.licensing.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import rw.bnr.licensing.domain.entity.AuditEntry;
import rw.bnr.licensing.domain.entity.User;
import rw.bnr.licensing.domain.repository.AuditEntryRepository;
import rw.bnr.licensing.domain.repository.UserRepository;
import rw.bnr.licensing.dto.audit.AuditEntryResponse;
import rw.bnr.licensing.security.PortalUserPrincipal;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit", description = "Append-only audit log access")
public class AuditController {

    private final AuditEntryRepository auditEntryRepository;
    private final UserRepository userRepository;

    public AuditController(AuditEntryRepository auditEntryRepository, UserRepository userRepository) {
        this.auditEntryRepository = auditEntryRepository;
        this.userRepository = userRepository;
    }


    @GetMapping("/applications/{id}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    @Operation(summary = "Full audit trail for an application (AUDITOR/ADMIN — includes state JSON)")
    public ResponseEntity<List<AuditEntryFullResponse>> getApplicationAuditTrail(
            @PathVariable UUID id,
            @AuthenticationPrincipal PortalUserPrincipal principal
    ) {
        List<AuditEntry> entries = auditEntryRepository.findByApplicationIdOrderByCreatedAtAsc(id);
        Map<UUID, User> actors = resolveActors(entries);

        List<AuditEntryFullResponse> response = entries.stream()
                .map(e -> toFullResponse(e, actors))
                .toList();

        return ResponseEntity.ok(response);
    }


    @GetMapping("/global")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Global audit log — all entries (ADMIN only)")
    public ResponseEntity<Page<AuditEntryFullResponse>> getGlobalAuditLog(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        // Fetch paginated — most recent first
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 200),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        List<AuditEntry> all = auditEntryRepository.findAll(pageRequest).getContent();
        long total = auditEntryRepository.count();
        Map<UUID, User> actors = resolveActors(all);

        List<AuditEntryFullResponse> content = all.stream()
                .map(e -> toFullResponse(e, actors))
                .toList();

        return ResponseEntity.ok(new PageImpl<>(content, pageRequest, total));
    }



    private Map<UUID, User> resolveActors(List<AuditEntry> entries) {
        List<UUID> actorIds = entries.stream()
                .map(AuditEntry::getActorId)
                .distinct()
                .toList();
        return userRepository.findAllById(actorIds)
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private AuditEntryFullResponse toFullResponse(AuditEntry e, Map<UUID, User> actors) {
        return new AuditEntryFullResponse(
                e.getId(),
                e.getApplicationId(),
                e.getActorId(),
                actors.containsKey(e.getActorId()) ? actors.get(e.getActorId()).getFullName() : "Unknown",
                e.getActorRole() != null ? e.getActorRole().name() : null,
                e.getAction() != null ? e.getAction().name() : null,
                e.getDescription(),
                e.getPreviousState(),
                e.getNewState(),
                e.getCreatedAt()
        );
    }



    public record AuditEntryFullResponse(
            UUID id,
            UUID applicationId,
            UUID actorId,
            String actorName,
            String actorRole,
            String action,
            String description,
            String previousState,
            String newState,
            java.time.Instant createdAt
    ) {}
}
