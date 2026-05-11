CREATE TABLE bnr.application_info_requested_items (
    application_id UUID NOT NULL,
    item CLOB,
    FOREIGN KEY (application_id) REFERENCES bnr.applications(id) ON DELETE CASCADE
);
