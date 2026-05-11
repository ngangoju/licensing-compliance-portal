CREATE TABLE bnr.applications (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number         VARCHAR(30) UNIQUE NOT NULL,
    applicant_id             UUID NOT NULL REFERENCES bnr.users(id),
    license_type             license_type NOT NULL,
    institution_name         VARCHAR(255) NOT NULL,
    proposed_name            VARCHAR(255),
    proposed_capital_rwf     BIGINT NOT NULL,
    registered_country       VARCHAR(100) NOT NULL DEFAULT 'Rwanda',
    head_office_address      TEXT,
    is_foreign_institution   BOOLEAN NOT NULL DEFAULT FALSE,
    home_supervisor_name     VARCHAR(255),
    home_supervisor_email    VARCHAR(255),
    status                   application_status NOT NULL DEFAULT 'DRAFT',
    version                  INTEGER NOT NULL DEFAULT 1,
    case_manager_id          UUID REFERENCES bnr.users(id),
    compliance_officer_id    UUID REFERENCES bnr.users(id),
    technical_reviewer_id    UUID REFERENCES bnr.users(id),
    legal_officer_id         UUID REFERENCES bnr.users(id),
    inspection_officer_id    UUID REFERENCES bnr.users(id),
    sla_working_days_target  INTEGER NOT NULL DEFAULT 90,
    sla_clock_started_at     TIMESTAMPTZ,
    sla_clock_paused_at      TIMESTAMPTZ,
    sla_working_days_used    INTEGER NOT NULL DEFAULT 0,
    sla_paused_reason        TEXT,
    aip_granted_at           TIMESTAMPTZ,
    aip_granted_by           UUID REFERENCES bnr.users(id),
    aip_expires_at           TIMESTAMPTZ,
    organization_deadline    TIMESTAMPTZ,
    license_fee_paid_at      TIMESTAMPTZ,
    license_issued_at        TIMESTAMPTZ,
    license_issued_by        UUID REFERENCES bnr.users(id),
    license_number           VARCHAR(30) UNIQUE,
    completeness_notes       TEXT,
    technical_review_notes   TEXT,
    legal_review_notes       TEXT,
    rejection_reason         TEXT,
    final_status_at          TIMESTAMPTZ,
    submitted_at             TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reviewer_not_licensor
        CHECK (license_issued_by IS DISTINCT FROM technical_reviewer_id),
    CONSTRAINT chk_compliance_not_licensor
        CHECK (license_issued_by IS DISTINCT FROM compliance_officer_id)
);

CREATE INDEX idx_applications_status ON bnr.applications(status);
CREATE INDEX idx_applications_applicant ON bnr.applications(applicant_id);
CREATE INDEX idx_applications_ref ON bnr.applications(reference_number);
CREATE INDEX idx_applications_sla ON bnr.applications(sla_clock_started_at)
    WHERE status NOT IN ('LICENSED', 'REJECTED', 'WITHDRAWN', 'AIP_EXPIRED');
