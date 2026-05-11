package rw.bnr.licensing.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import rw.bnr.licensing.domain.enums.AuditAction;
import rw.bnr.licensing.security.PortalUserPrincipal;

import java.sql.Types;
import java.util.UUID;

@Service
public class AuditService {

    private final JdbcTemplate jdbcTemplate;

    public AuditService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void record(
            UUID applicationId,
            PortalUserPrincipal actor,
            AuditAction action,
            String description,
            String previousState,
            String newState,
            String ipAddress,
            String userAgent
    ) {
        record(applicationId, actor.getId(), actor.getRole().name(), action, description, previousState, newState, ipAddress, userAgent);
    }

    public void record(
            UUID applicationId,
            UUID actorId,
            String actorRole,
            AuditAction action,
            String description,
            String previousState,
            String newState,
            String ipAddress,
            String userAgent
    ) {
        // Automatically extract IP and User-Agent from RequestContext if not provided or if provided as 127.0.0.1
        String finalIp = ipAddress;
        String finalUserAgent = userAgent;

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                if (finalIp == null || "127.0.0.1".equals(finalIp) || "internal".equals(finalIp)) {
                    finalIp = request.getRemoteAddr();
                }
                if (finalUserAgent == null || "Backend".equals(finalUserAgent) || "system".equals(finalUserAgent)) {
                    finalUserAgent = request.getHeader("User-Agent");
                }
            }
        } catch (Exception e) {
            // Fallback if not in a request context
        }

        if (finalIp == null) finalIp = "unknown";
        if (finalUserAgent == null) finalUserAgent = "unknown";

        String databaseName = jdbcTemplate.execute((org.springframework.jdbc.core.ConnectionCallback<String>)
                connection -> connection.getMetaData().getDatabaseProductName());
        if ("H2".equalsIgnoreCase(databaseName)) {
            // Ensure schema and table exist in H2 (since Flyway is disabled in dev)
            jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS \"audit\"");
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS "audit"."log" (
                    "id" UUID PRIMARY KEY,
                    "application_id" UUID,
                    "actor_id" UUID,
                    "actor_role" VARCHAR,
                    "action" VARCHAR,
                    "description" TEXT,
                    "previous_state" VARCHAR,
                    "new_state" VARCHAR,
                    "ip_address" VARCHAR,
                    "user_agent" TEXT,
                    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """);

            jdbcTemplate.update(
                    """
                    INSERT INTO "audit"."log" (
                        "id", "application_id", "actor_id", "actor_role", "action", "description",
                        "previous_state", "new_state", "ip_address", "user_agent", "created_at"
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """,
                    UUID.randomUUID(),
                    applicationId,
                    actorId,
                    actorRole,
                    action.name(),
                    description,
                    previousState,
                    newState,
                    finalIp,
                    finalUserAgent
            );
            return;
        }

        jdbcTemplate.update(
                """
                SELECT audit.record_event(
                    ?,
                    ?,
                    CAST(? AS user_role),
                    CAST(? AS audit_action),
                    ?,
                    CAST(? AS jsonb),
                    CAST(? AS jsonb),
                    CAST(? AS inet),
                    ?
                )
                """,
                new Object[]{
                        applicationId,
                        actorId,
                        actorRole,
                        action.name(),
                        description,
                        previousState,
                        newState,
                        finalIp,
                        finalUserAgent
                },
                new int[]{
                        Types.OTHER,
                        Types.OTHER,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.VARCHAR,
                        Types.VARCHAR
                }
        );
    }
}
