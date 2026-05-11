CREATE TABLE audit.log (
    id UUID PRIMARY KEY,
    application_id UUID,
    actor_id UUID NOT NULL,
    actor_role VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    description CLOB,
    previous_state CLOB,
    new_state CLOB,
    ip_address VARCHAR(64),
    user_agent CLOB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_application ON audit.log(application_id);
CREATE INDEX idx_audit_actor ON audit.log(actor_id);
CREATE INDEX idx_audit_created ON audit.log(created_at);
CREATE INDEX idx_audit_action ON audit.log(action);
