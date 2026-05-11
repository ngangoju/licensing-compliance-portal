CREATE TABLE bnr.application_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES bnr.applications(id),
    document_type   VARCHAR(100) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_path     VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes <= 5242880),
    version         INTEGER NOT NULL DEFAULT 1,
    is_current      BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by     UUID NOT NULL REFERENCES bnr.users(id),
    upload_stage    application_status NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (application_id, document_type, version)
);
