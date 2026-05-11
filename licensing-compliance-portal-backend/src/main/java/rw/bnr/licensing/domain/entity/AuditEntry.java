package rw.bnr.licensing.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;
import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.domain.enums.UserRole;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "log", schema = "audit")
@Immutable
public class AuditEntry {

    @Id
    private UUID id;

    @Column(name = "application_id")
    private UUID applicationId;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role", nullable = false)
    private UserRole actorRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuditAction action;

    @Column
    private String description;

    @Column(name = "previous_state")
    private String previousState;

    @Column(name = "new_state")
    private String newState;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AuditEntry() {
    }

    public UUID getId() {
        return id;
    }

    public UUID getApplicationId() {
        return applicationId;
    }

    public UUID getActorId() {
        return actorId;
    }

    public UserRole getActorRole() {
        return actorRole;
    }

    public AuditAction getAction() {
        return action;
    }

    public String getDescription() {
        return description;
    }

    public String getPreviousState() {
        return previousState;
    }

    public String getNewState() {
        return newState;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
