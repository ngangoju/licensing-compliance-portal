INSERT INTO bnr.users (id, email, password_hash, role, full_name, organisation)
VALUES ('0fa64ad2-738d-4ece-a8c5-8d1888c4cf60', 'case.manager@bnr.rw', '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'CASE_MANAGER', 'Aline Umugwaneza', 'BNR Licensing Dept')
ON CONFLICT (email) DO NOTHING;

INSERT INTO bnr.applications (
    id, reference_number, applicant_id, license_type, institution_name, proposed_name,
    proposed_capital_rwf, registered_country, head_office_address, is_foreign_institution,
    status, case_manager_id, compliance_officer_id, technical_reviewer_id, legal_officer_id,
    inspection_officer_id, sla_working_days_target, sla_clock_started_at, sla_working_days_used,
    aip_granted_at, aip_granted_by, aip_expires_at, organization_deadline, license_fee_paid_at,
    license_issued_at, license_issued_by, license_number, technical_review_notes, submitted_at,
    created_at, updated_at
) VALUES
(
    '7a7f54e3-ec9d-4d73-83f1-c51fbf989824',
    'BNR-2025-0001',
    '455a0c03-284c-45cd-a776-65abd77e3635',
    'COMMERCIAL_BANK',
    'Kigali Commercial Bank PLC',
    'Kigali Commercial Bank',
    25000000000,
    'Rwanda',
    'KN 3 Road, Kigali',
    FALSE,
    'TECHNICAL_REVIEW',
    '0fa64ad2-738d-4ece-a8c5-8d1888c4cf60',
    'a8ea1ce1-93f1-47d2-aa8e-22a453524107',
    'e37bd565-e60a-4744-aa04-373ef0aee860',
    NULL,
    NULL,
    90,
    NOW() - INTERVAL '32 days',
    32,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'Economic sustainability review underway.',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '2 days'
),
(
    'd786d4c9-f4ba-478f-806a-30c824ff54b6',
    'BNR-2024-0017',
    '455a0c03-284c-45cd-a776-65abd77e3635',
    'FOREX_BUREAU',
    'Kigali Forex Bureau Ltd',
    'Kigali Forex Bureau',
    500000000,
    'Rwanda',
    'KG 11 Avenue, Kigali',
    FALSE,
    'LICENSED',
    '0fa64ad2-738d-4ece-a8c5-8d1888c4cf60',
    'a8ea1ce1-93f1-47d2-aa8e-22a453524107',
    'e37bd565-e60a-4744-aa04-373ef0aee860',
    '4a08d631-5afb-40d7-a4f1-7962f54d136a',
    '59d681e7-0cf6-4b86-96fe-d3a9c5a9ae94',
    90,
    NOW() - INTERVAL '200 days',
    78,
    NOW() - INTERVAL '120 days',
    '7a94b975-1166-4335-8a15-91dba4d1005a',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '5 days',
    TIMESTAMP '2024-03-15 09:00:00+00',
    'cd738318-8086-48fc-a894-1749f93a922c',
    'BNR/FB/2024/001',
    'Licensed and operational.',
    NOW() - INTERVAL '220 days',
    NOW() - INTERVAL '240 days',
    NOW() - INTERVAL '5 days'
),
(
    '0b922896-c972-4263-ad11-6e822ee2a697',
    'BNR-2025-0009',
    '455a0c03-284c-45cd-a776-65abd77e3635',
    'MICROFINANCE_INSTITUTION_TIER1',
    'Umurage Microfinance Ltd',
    'Umurage Microfinance',
    5000000000,
    'Rwanda',
    'Musanze District',
    FALSE,
    'ORGANIZATION_PERIOD',
    '0fa64ad2-738d-4ece-a8c5-8d1888c4cf60',
    'a8ea1ce1-93f1-47d2-aa8e-22a453524107',
    'e37bd565-e60a-4744-aa04-373ef0aee860',
    '4a08d631-5afb-40d7-a4f1-7962f54d136a',
    '59d681e7-0cf6-4b86-96fe-d3a9c5a9ae94',
    90,
    NOW() - INTERVAL '150 days',
    64,
    NOW() - INTERVAL '180 days',
    '7a94b975-1166-4335-8a15-91dba4d1005a',
    NOW() + INTERVAL '180 days',
    NOW() + INTERVAL '180 days',
    NULL,
    NULL,
    NULL,
    NULL,
    'Awaiting completion of final conditions.',
    NOW() - INTERVAL '210 days',
    NOW() - INTERVAL '240 days',
    NOW() - INTERVAL '4 days'
)
ON CONFLICT (reference_number) DO NOTHING;

INSERT INTO bnr.license_conditions (
    id, application_id, condition_text, category, is_fulfilled, fulfilled_at, fulfilled_by, fulfillment_note, due_date
) VALUES
(
    '5d8c7f4b-61b9-4e4b-982a-a6f390e83231',
    'd786d4c9-f4ba-478f-806a-30c824ff54b6',
    'Install forex surveillance reporting link with BNR.',
    'IT',
    TRUE,
    NOW() - INTERVAL '18 days',
    '59d681e7-0cf6-4b86-96fe-d3a9c5a9ae94',
    'Verified during inspection.',
    NOW() - INTERVAL '25 days'
),
(
    '72f07ec1-cf56-4983-ba04-4814a1fd6920',
    'd786d4c9-f4ba-478f-806a-30c824ff54b6',
    'Submit final AML operations manual.',
    'AML',
    TRUE,
    NOW() - INTERVAL '16 days',
    '59d681e7-0cf6-4b86-96fe-d3a9c5a9ae94',
    'Approved by BNR examination team.',
    NOW() - INTERVAL '25 days'
),
(
    '23b3dd36-f865-4381-b439-ff7127dc121b',
    '0b922896-c972-4263-ad11-6e822ee2a697',
    'Deposit initial paid-up capital into blocked account.',
    'CAPITAL',
    TRUE,
    NOW() - INTERVAL '45 days',
    '59d681e7-0cf6-4b86-96fe-d3a9c5a9ae94',
    'Capital deposit proof reviewed.',
    NOW() + INTERVAL '120 days'
),
(
    '3b2d86e5-9be6-46e4-b9f2-2094afbfa74e',
    '0b922896-c972-4263-ad11-6e822ee2a697',
    'Complete recruitment of core risk and compliance officers.',
    'GOVERNANCE',
    FALSE,
    NULL,
    NULL,
    NULL,
    NOW() + INTERVAL '120 days'
),
(
    'dca7e440-c15e-4995-87f0-d450624b1c4c',
    '0b922896-c972-4263-ad11-6e822ee2a697',
    'Finish installation of branch banking systems.',
    'IT',
    FALSE,
    NULL,
    NULL,
    NULL,
    NOW() + INTERVAL '120 days'
)
ON CONFLICT DO NOTHING;

INSERT INTO bnr.fit_and_proper_assessments (
    id, application_id, assessed_by, individual_name, individual_role,
    interview_conducted, outcome, outcome_notes, assessed_at
) VALUES
(
    '85e9411c-5769-4e0f-8f65-eb524250821a',
    '7a7f54e3-ec9d-4d73-83f1-c51fbf989824',
    '7ca05b2f-ef44-4839-a371-69bc003572a1',
    'Alice Mukakarangwa',
    'DIRECTOR',
    TRUE,
    'FIT',
    'Director cleared after interview and background review.',
    NOW() - INTERVAL '12 days'
),
(
    '62186eff-cf18-4842-bca8-8f9d4d34ef1d',
    '7a7f54e3-ec9d-4d73-83f1-c51fbf989824',
    '7ca05b2f-ef44-4839-a371-69bc003572a1',
    'Samuel Nkurunziza',
    'CEO',
    TRUE,
    'FIT',
    'Executive management review passed.',
    NOW() - INTERVAL '11 days'
)
ON CONFLICT DO NOTHING;

INSERT INTO bnr.inspection_reports (
    id, application_id, inspection_officer_id, scheduled_date, conducted_date,
    premises_verified, capital_verified, capital_amount_rwf, it_systems_verified,
    aml_framework_ok, staffing_adequate, policy_manuals_ok, overall_outcome,
    findings, conditions_outstanding
) VALUES
(
    '97844baf-3075-4328-9b62-8645e409ffef',
    'd786d4c9-f4ba-478f-806a-30c824ff54b6',
    '59d681e7-0cf6-4b86-96fe-d3a9c5a9ae94',
    CURRENT_DATE - 18,
    CURRENT_DATE - 17,
    TRUE,
    TRUE,
    500000000,
    TRUE,
    TRUE,
    TRUE,
    TRUE,
    'PASSED',
    'All AIP conditions satisfied and premises ready for operation.',
    '[]'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO audit.log (
    id, application_id, actor_id, actor_role, action, description, previous_state, new_state, created_at
) VALUES
(
    gen_random_uuid(),
    '7a7f54e3-ec9d-4d73-83f1-c51fbf989824',
    '455a0c03-284c-45cd-a776-65abd77e3635',
    'APPLICANT',
    'APPLICATION_CREATED',
    'Commercial bank application created by applicant.',
    NULL,
    '{"status":"DRAFT"}'::jsonb,
    NOW() - INTERVAL '60 days'
),
(
    gen_random_uuid(),
    '7a7f54e3-ec9d-4d73-83f1-c51fbf989824',
    'e37bd565-e60a-4744-aa04-373ef0aee860',
    'TECHNICAL_REVIEWER',
    'TECHNICAL_REVIEW_STARTED',
    'Technical review is in progress.',
    '{"status":"FIT_AND_PROPER_ASSESSMENT"}'::jsonb,
    '{"status":"TECHNICAL_REVIEW"}'::jsonb,
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    'd786d4c9-f4ba-478f-806a-30c824ff54b6',
    '7a94b975-1166-4335-8a15-91dba4d1005a',
    'LICENSING_COMMITTEE',
    'APPROVAL_IN_PRINCIPLE_GRANTED',
    'Committee granted approval in principle with conditions.',
    '{"status":"COMMITTEE_DELIBERATION"}'::jsonb,
    '{"status":"APPROVAL_IN_PRINCIPLE"}'::jsonb,
    NOW() - INTERVAL '120 days'
),
(
    gen_random_uuid(),
    'd786d4c9-f4ba-478f-806a-30c824ff54b6',
    'cd738318-8086-48fc-a894-1749f93a922c',
    'GOVERNOR_DELEGATE',
    'LICENSE_ISSUED',
    'Final license issued after successful inspection and fee confirmation.',
    '{"status":"LICENSE_FEE_PENDING"}'::jsonb,
    '{"status":"LICENSED"}'::jsonb,
    TIMESTAMP '2024-03-15 09:00:00+00'
),
(
    gen_random_uuid(),
    '0b922896-c972-4263-ad11-6e822ee2a697',
    '7a94b975-1166-4335-8a15-91dba4d1005a',
    'LICENSING_COMMITTEE',
    'APPROVAL_IN_PRINCIPLE_GRANTED',
    'AIP granted with organization period conditions.',
    '{"status":"COMMITTEE_DELIBERATION"}'::jsonb,
    '{"status":"ORGANIZATION_PERIOD"}'::jsonb,
    NOW() - INTERVAL '180 days'
);
