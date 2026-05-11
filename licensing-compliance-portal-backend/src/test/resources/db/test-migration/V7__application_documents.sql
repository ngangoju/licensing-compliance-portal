CREATE TABLE bnr.application_documents (
    id UUID PRIMARY KEY,
    application_id UUID NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    stored_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes <= 5242880),
    version INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by UUID NOT NULL,
    upload_stage VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (application_id, document_type, version)
);
