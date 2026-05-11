CREATE TABLE bnr.inspection_reports (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id        UUID NOT NULL REFERENCES bnr.applications(id),
    inspection_officer_id UUID NOT NULL REFERENCES bnr.users(id),
    scheduled_date        DATE NOT NULL,
    conducted_date        DATE,
    premises_verified     BOOLEAN,
    capital_verified      BOOLEAN,
    capital_amount_rwf    BIGINT,
    it_systems_verified   BOOLEAN,
    aml_framework_ok      BOOLEAN,
    staffing_adequate     BOOLEAN,
    policy_manuals_ok     BOOLEAN,
    overall_outcome       VARCHAR(20),
    findings              TEXT,
    conditions_outstanding JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
