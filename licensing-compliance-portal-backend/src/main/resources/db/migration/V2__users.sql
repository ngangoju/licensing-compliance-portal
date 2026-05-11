CREATE TABLE bnr.users (
    id            UUID PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(30),
    organisation  VARCHAR(255),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bnr.users (id, email, password_hash, role, full_name, organisation) VALUES
  ('455a0c03-284c-45cd-a776-65abd77e3635', 'applicant@kcb.rw',        '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'APPLICANT',              'Jean Pierre Habimana',   'KCB Rwanda Promoters'),
  ('a8ea1ce1-93f1-47d2-aa8e-22a453524107', 'compliance@bnr.rw',       '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'COMPLIANCE_OFFICER',     'Marie Claire Uwase',     'BNR Licensing Dept'),
  ('e37bd565-e60a-4744-aa04-373ef0aee860', 'reviewer@bnr.rw',         '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'TECHNICAL_REVIEWER',     'Patrick Ndayisenga',     'BNR Licensing Dept'),
  ('7ca05b2f-ef44-4839-a371-69bc003572a1', 'fp.officer@bnr.rw',       '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'FIT_AND_PROPER_OFFICER', 'Claudine Mukamana',      'BNR Licensing Dept'),
  ('4a08d631-5afb-40d7-a4f1-7962f54d136a', 'legal@bnr.rw',            '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'LEGAL_OFFICER',          'Emmanuel Nshimiyimana',  'BNR Legal Division'),
  ('59d681e7-0cf6-4b86-96fe-d3a9c5a9ae94', 'inspector@bnr.rw',        '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'INSPECTION_OFFICER',     'Solange Ingabire',       'BNR Examination Dept'),
  ('7a94b975-1166-4335-8a15-91dba4d1005a', 'committee@bnr.rw',        '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'LICENSING_COMMITTEE',    'Dr. Jennifer Batamuliza',      'BNR Board Committee'),
  ('cd738318-8086-48fc-a894-1749f93a922c', 'governor.delegate@bnr.rw','$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'GOVERNOR_DELEGATE',      'Soraya M. Hakuziyaremye',  'BNR Executive'),
  ('9bcbcbdb-ec87-4d21-aed4-bbcdded667ee', 'admin@bnr.rw',           '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'ADMIN',                  'Eric Mugisha',           'BNR IT Dept'),
  ('64d1688a-75eb-45ad-9559-23f82f633fab', 'auditor@bnr.rw',          '$2y$12$hyvXuJhCT0tcGuwexT.LM.o.TuSRnZmnyzYOL1Ii2TAPGyeRiBNzK', 'AUDITOR',                'Jeannette Nzeyimana',    'BNR Internal Audit');
