CREATE TABLE bnr.inspection_reports (
    id UUID PRIMARY KEY,
    application_id UUID NOT NULL,
    inspection_officer_id UUID NOT NULL,
    scheduled_date DATE NOT NULL,
    conducted_date DATE,
    premises_verified BOOLEAN,
    capital_verified BOOLEAN,
    capital_amount_rwf BIGINT,
    it_systems_verified BOOLEAN,
    aml_framework_ok BOOLEAN,
    staffing_adequate BOOLEAN,
    policy_manuals_ok BOOLEAN,
    overall_outcome VARCHAR(20),
    findings CLOB,
    conditions_outstanding CLOB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
