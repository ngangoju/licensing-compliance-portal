CREATE TABLE bnr.license_conditions (
    id UUID PRIMARY KEY,
    application_id UUID NOT NULL,
    condition_text CLOB NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_fulfilled BOOLEAN NOT NULL DEFAULT FALSE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    fulfilled_by UUID,
    fulfillment_document_id UUID,
    fulfillment_note CLOB,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
