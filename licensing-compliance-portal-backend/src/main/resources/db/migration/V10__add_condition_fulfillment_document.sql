ALTER TABLE license_conditions
ADD COLUMN fulfillment_document_id UUID REFERENCES application_documents(id);
