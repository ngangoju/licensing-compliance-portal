CREATE TABLE audit.log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID,
    actor_id       UUID NOT NULL,
    actor_role     user_role NOT NULL,
    action         audit_action NOT NULL,
    description    TEXT,
    previous_state JSONB,
    new_state      JSONB,
    ip_address     INET,
    user_agent     TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_application ON audit.log(application_id);
CREATE INDEX idx_audit_actor ON audit.log(actor_id);
CREATE INDEX idx_audit_created ON audit.log(created_at DESC);
CREATE INDEX idx_audit_action ON audit.log(action);

CREATE OR REPLACE FUNCTION audit.record_event(
    p_application_id UUID,
    p_actor_id UUID,
    p_actor_role user_role,
    p_action audit_action,
    p_description TEXT,
    p_previous_state JSONB,
    p_new_state JSONB,
    p_ip_address INET,
    p_user_agent TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO audit.log (
        application_id, actor_id, actor_role, action, description,
        previous_state, new_state, ip_address, user_agent
    ) VALUES (
        p_application_id, p_actor_id, p_actor_role, p_action, p_description,
        p_previous_state, p_new_state, p_ip_address, p_user_agent
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION audit.prevent_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'audit.log is append-only';
END;
$$;

CREATE TRIGGER trg_audit_log_prevent_update
    BEFORE UPDATE ON audit.log
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_mutation();

CREATE TRIGGER trg_audit_log_prevent_delete
    BEFORE DELETE ON audit.log
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_mutation();

REVOKE ALL ON audit.log FROM PUBLIC;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bnr_app') THEN
        EXECUTE 'REVOKE ALL ON audit.log FROM bnr_app';
        EXECUTE 'GRANT EXECUTE ON FUNCTION audit.record_event(UUID, UUID, user_role, audit_action, TEXT, JSONB, JSONB, INET, TEXT) TO bnr_app';
    END IF;
END;
$$;
