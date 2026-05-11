CREATE TABLE bnr.license_conditions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id   UUID NOT NULL REFERENCES bnr.applications(id),
    condition_text   TEXT NOT NULL,
    category         VARCHAR(100) NOT NULL,
    is_fulfilled     BOOLEAN NOT NULL DEFAULT FALSE,
    fulfilled_at     TIMESTAMPTZ,
    fulfilled_by     UUID REFERENCES bnr.users(id),
    fulfillment_note TEXT,
    due_date         TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
