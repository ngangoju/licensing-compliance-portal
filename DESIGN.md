# Bank Licensing & Compliance Portal — Design Document
### National Bank of Rwanda (BNR) — Senior Software Engineer Assessment

---

## Table of Contents

1. [How Central Bank Licensing Actually Works](#1-how-central-bank-licensing-actually-works)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Project Structure](#4-project-structure)
5. [Data Model](#5-data-model)
6. [State Machine](#6-state-machine)
7. [Roles & Permission Matrix](#7-roles--permission-matrix)
8. [Licensing Process — Stage by Stage](#8-licensing-process--stage-by-stage)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Audit Trail — Tamper-Proof Design](#10-audit-trail--tamper-proof-design)
11. [Concurrency Control](#11-concurrency-control)
12. [Document Handling & Versioning](#12-document-handling--versioning)
13. [SLA Clock — Statutory Timeline Tracking](#13-sla-clock--statutory-timeline-tracking)
14. [API Design](#14-api-design)
15. [Frontend Design System](#15-frontend-design-system)
16. [Testing Strategy](#16-testing-strategy)
17. [Seed Data](#17-seed-data)
18. [Hard Decisions & Trade-offs](#18-hard-decisions--trade-offs)
19. [Out of Scope — Documented](#19-out-of-scope--documented)
20. [README Checklist](#20-readme-checklist)

---

## 1. How Central Bank Licensing Actually Works

Before designing the system, it is worth understanding the domain precisely — because most generic workflow tools built for this context get the process fundamentally wrong.

### The critical distinction: Approval-in-Principle vs Final License

Almost every central bank in the world — the Bank of England, the ECB, the Central Bank of Kenya, the Central Bank of Kosovo, the OCC in the United States — issues **two separate decisions**, not one:

1. **Approval-in-Principle (AIP):** A conditional, preliminary approval. The bank does not yet exist and cannot yet operate. The AIP says: *"You have satisfied our criteria on paper. You now have 12 months to actually build the bank."*
2. **Final License:** Granted only after the applicant has physically organized the institution — injected the required capital into an escrow/suspense account, hired staff, established premises, implemented IT systems, developed all policy manuals — and BNR has physically inspected those conditions.

A system with a single `APPROVED` state models neither of these decisions correctly. It collapses the most legally consequential distinction in the licensing process.

### The pre-opening inspection

Before the final license is issued, BNR's examination team visits the applicant's proposed premises to verify that every condition attached to the AIP has been fulfilled. They check that capital has been deposited and verified, that the IT systems are operational, that the AML compliance framework is in place, and that staff have been hired and trained. Passing this inspection is a prerequisite for the final license — not a formality.

### The SLA clock

Central banks make binding statutory commitments about how long an assessment will take. BNR is expected to process applications within a defined number of working days. However, this clock **pauses** when the applicant has been asked for additional information and has not yet responded. It can be **suspended entirely** if major changes to the application occur. Tracking this is not optional — it is a regulatory obligation of the bank itself.

### Fit-and-proper assessment

Every director, every significant shareholder (typically anyone holding 5% or more of shares), and every proposed senior manager must be individually assessed for fitness and propriety. This means: no criminal record, no history of financial misconduct, appropriate qualifications, no conflict of interest. This is not a checkbox on a form — it is a structured assessment that may involve interviews, reference checks, and coordination with law enforcement. It is a distinct phase with its own data.

### Name approval

Before the formal application can be submitted, the proposed institution name must be approved by BNR. Names that conflict with existing licensed institutions, that could mislead the public, or that imply a function the institution is not licensed for will be rejected. This is handled as a pre-application administrative step.

### Post-AIP organization period

After AIP is granted, the applicant has a fixed period — typically 12 months — to organize the bank. If they fail to complete this within the deadline, the AIP expires and must be re-applied for. Material changes during this period (ownership changes, capital shortfalls, new information about directors) must be reported to BNR within 15 days and may cause the AIP to be reviewed or revoked.

### What this means for the system design

The previous version of this blueprint had:
- One `APPROVED` state — replaced by `APPROVAL_IN_PRINCIPLE` → `LICENSED`
- No organization period — now tracked with a deadline and expiry
- No inspection stage — now a distinct workflow step
- No fit-and-proper entity — now first-class data
- No SLA clock — now tracked per application with pause/resume logic
- No license conditions — now stored and individually tracked

---

## 2. Technology Stack

| Layer | Choice | Justification |
|---|---|---|
| **Backend** | Spring Boot 3.3 (Java 21) | ACID guarantees via JPA, mature Spring Security RBAC, virtual threads (Project Loom), deep ecosystem. |
| **Database** | PostgreSQL 16 | Row-level locking, `FOR UPDATE SKIP LOCKED`, JSONB for state snapshots, schema-level permissions for audit isolation. |
| **ORM / Migrations** | Spring Data JPA + Hibernate 6 + Flyway | `@Version` for optimistic locking. Flyway for versioned, repeatable migrations. |
| **Auth** | Spring Security + JWT (JJWT) | Stateless, horizontally scalable. Spring Security filter chain is a single enforcement chokepoint before any business logic. |
| **File Storage** | Local filesystem (simulated) | UUID-named files under `storage/{applicationId}/`. Metadata in PostgreSQL. 5 MB cap enforced at service layer. |
| **Frontend** | Next.js 14 (App Router) + TypeScript | Server Components enforce role-gating before any page HTML is sent. Eliminates a class of client-side bypass bugs. |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first with accessible headless primitives. NBR design tokens via CSS custom properties. |
| **API Docs** | SpringDoc OpenAPI 3 | Auto-generates `/swagger-ui.html` and `/v3/api-docs`. |
| **Testing** | JUnit 5 + Mockito + Testcontainers | Real PostgreSQL container for state machine and concurrency tests. |
| **Build** | Maven (backend) · pnpm (frontend) | |

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────┐
│               Next.js 14 (App Router)              │
│                                                    │
│  /app/(auth)/        → login, register             │
│  /app/(applicant)/   → server-side role guard      │
│  /app/(bnr)/         → server-side role guard      │
│  /app/(public)/      → license register (public)   │
└───────────────────────┬────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼────────────────────────────┐
│              Spring Boot 3  (port 8080)             │
│                                                    │
│  ┌─────────────────────────────────────────────┐   │
│  │  Spring Security Filter Chain               │   │
│  │  JWT validation → Role extraction           │   │
│  │  → SecurityContext population               │   │
│  └──────────────────┬──────────────────────────┘   │
│                     │                              │
│  ┌──────────────────▼──────────────────────────┐   │
│  │  Controllers (REST)                         │   │
│  │  Auth · Application · Review · Approval     │   │
│  │  Document · Audit · Admin · Inspection      │   │
│  │  FitAndProper · LicenseRegister             │   │
│  └──────────────────┬──────────────────────────┘   │
│                     │                              │
│  ┌──────────────────▼──────────────────────────┐   │
│  │  Service Layer  (all business rules here)   │   │
│  │  StateMachineService · SlaClockService      │   │
│  │  AuditService · DocumentService             │   │
│  │  FitAndProperService · InspectionService    │   │
│  └──────────────────┬──────────────────────────┘   │
│                     │                              │
│  ┌──────────────────▼──────────────────────────┐   │
│  │  Repository Layer (Spring Data JPA)         │   │
│  └──────────────────┬──────────────────────────┘   │
└─────────────────────┼──────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐         ┌──────────────────┐
│  PostgreSQL   │         │  Local Filesystem │
│  Schema: bnr  │         │  storage/{appId}/ │
│  Schema: audit│         │                  │
└───────────────┘         └──────────────────┘
```

**Two-schema PostgreSQL layout.** The `audit` schema is isolated from the application schema. The application database user (`bnr_app`) has zero permissions on `audit.*` except the ability to execute a `SECURITY DEFINER` function that inserts records. Even a compromised credential cannot `UPDATE` or `DELETE` audit rows.

**Architectural principle:** The audit trail is not a side table. Every state transition is wrapped in a single database transaction that atomically writes both the state change and the audit entry. Either both succeed or both roll back.

---

## 4. Project Structure

### Backend

```
backend/
├── src/main/java/rw/bnr/licensing/
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── JwtConfig.java
│   │   └── FileStorageConfig.java
│   ├── domain/
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── Application.java
│   │   │   ├── LicenseCondition.java      ← conditions attached to AIP
│   │   │   ├── FitAndProperAssessment.java ← per-individual assessment
│   │   │   ├── InspectionReport.java      ← pre-opening inspection
│   │   │   ├── ApplicationDocument.java
│   │   │   └── AuditEntry.java
│   │   └── enums/
│   │       ├── UserRole.java
│   │       ├── ApplicationStatus.java
│   │       ├── LicenseType.java
│   │       ├── AssessmentOutcome.java
│   │       └── AuditAction.java
│   ├── service/
│   │   ├── ApplicationService.java
│   │   ├── StateMachineService.java
│   │   ├── SlaClockService.java           ← pause/resume/expire logic
│   │   ├── AuditService.java
│   │   ├── DocumentService.java
│   │   ├── FitAndProperService.java
│   │   ├── InspectionService.java
│   │   └── JwtService.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── ApplicationController.java
│   │   ├── NameApprovalController.java
│   │   ├── ComplianceController.java
│   │   ├── ReviewController.java
│   │   ├── FitAndProperController.java
│   │   ├── ApprovalController.java        ← AIP decisions
│   │   ├── InspectionController.java
│   │   ├── LicenseController.java         ← final license issuance
│   │   ├── AuditController.java
│   │   ├── AdminController.java
│   │   └── LicenseRegisterController.java ← public endpoint
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       ├── InvalidStateTransitionException.java
│       ├── SeparationOfDutiesException.java
│       ├── SlaClockExpiredException.java
│       └── OptimisticLockConflictException.java
├── src/main/resources/db/migration/
│   ├── V1__schemas_and_enums.sql
│   ├── V2__users.sql
│   ├── V3__applications.sql
│   ├── V4__license_conditions.sql
│   ├── V5__fit_and_proper.sql
│   ├── V6__inspection_reports.sql
│   ├── V7__documents.sql
│   ├── V8__audit_schema_and_permissions.sql
│   └── V9__seed_data.sql
└── src/test/java/rw/bnr/licensing/
    ├── StateMachineTest.java
    ├── AuthorizationTest.java
    ├── ConcurrencyTest.java
    ├── AuditTrailTest.java
    └── SlaClockTest.java
```

### Frontend

```
frontend/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (public)/register/page.tsx         ← public license register
│   ├── (applicant)/
│   │   ├── layout.tsx                     ← server-side role guard
│   │   ├── dashboard/page.tsx
│   │   ├── applications/new/page.tsx
│   │   ├── applications/[id]/page.tsx
│   │   └── applications/[id]/documents/page.tsx
│   └── (bnr)/
│       ├── layout.tsx                     ← server-side role guard
│       ├── dashboard/page.tsx
│       ├── applications/page.tsx          ← queue (role-filtered)
│       ├── applications/[id]/page.tsx     ← detail + action panel
│       ├── fit-and-proper/[id]/page.tsx
│       ├── inspections/page.tsx
│       ├── audit/page.tsx
│       └── admin/users/page.tsx
```

---

## 5. Data Model

### Enumerations

```sql
CREATE TYPE user_role AS ENUM (
    'APPLICANT',
    'CASE_MANAGER',         -- assigned to every application at completeness pass
    'COMPLIANCE_OFFICER',   -- completeness and document verification
    'TECHNICAL_REVIEWER',   -- business plan, capital, risk management
    'FIT_AND_PROPER_OFFICER', -- director and shareholder due diligence
    'LEGAL_OFFICER',        -- charter and bylaws review
    'INSPECTION_OFFICER',   -- pre-opening on-site inspection
    'LICENSING_COMMITTEE',  -- votes on AIP decisions
    'GOVERNOR_DELEGATE',    -- grants final license
    'ADMIN',
    'AUDITOR'
);

CREATE TYPE license_type AS ENUM (
    'COMMERCIAL_BANK',
    'MICROFINANCE_INSTITUTION_TIER1',   -- RWF 500M min capital
    'MICROFINANCE_INSTITUTION_TIER2',   -- RWF 150M min capital
    'SAVINGS_CREDIT_COOPERATIVE',       -- SACCO, RWF 50M
    'FOREX_BUREAU',                     -- RWF 20M
    'PAYMENT_SERVICE_PROVIDER',         -- RWF 200M
    'DEVELOPMENT_FINANCE_INSTITUTION',  -- RWF 2B
    'REPRESENTATIVE_OFFICE'             -- RWF 10M
);

CREATE TYPE application_status AS ENUM (
    'DRAFT',
    'NAME_APPROVAL_PENDING',
    'NAME_APPROVED',
    'SUBMITTED',
    'COMPLETENESS_CHECK',
    'INCOMPLETE',
    'CASE_ASSIGNED',
    'FIT_AND_PROPER_ASSESSMENT',
    'TECHNICAL_REVIEW',
    'ADDITIONAL_INFO_REQUESTED',
    'LEGAL_REVIEW',
    'COMMITTEE_DELIBERATION',
    'APPROVAL_IN_PRINCIPLE',         -- AIP granted with conditions, 12-month clock starts
    'ORGANIZATION_PERIOD',           -- applicant setting up operations
    'PRE_LICENSE_INSPECTION',        -- BNR on-site visit
    'INSPECTION_FAILED',             -- returned to organization period
    'LICENSE_FEE_PENDING',           -- final administrative step
    'LICENSED',                      -- final license issued — terminal
    'REJECTED',                      -- terminal
    'WITHDRAWN',                     -- terminal (before AIP only)
    'AIP_EXPIRED'                    -- terminal (12-month organization period missed)
);

CREATE TYPE audit_action AS ENUM (
    'APPLICATION_CREATED', 'NAME_APPROVAL_REQUESTED', 'NAME_APPROVED', 'NAME_REJECTED',
    'APPLICATION_SUBMITTED', 'COMPLETENESS_CHECK_STARTED', 'COMPLETENESS_PASSED',
    'COMPLETENESS_FAILED', 'CASE_MANAGER_ASSIGNED', 'FIT_AND_PROPER_STARTED',
    'FIT_AND_PROPER_COMPLETED', 'TECHNICAL_REVIEW_STARTED', 'ADDITIONAL_INFO_REQUESTED',
    'ADDITIONAL_INFO_PROVIDED', 'TECHNICAL_REVIEW_COMPLETED', 'LEGAL_REVIEW_STARTED',
    'LEGAL_REVIEW_COMPLETED', 'COMMITTEE_DELIBERATION_STARTED',
    'APPROVAL_IN_PRINCIPLE_GRANTED', 'APPROVAL_IN_PRINCIPLE_DENIED',
    'ORGANIZATION_PERIOD_STARTED', 'INSPECTION_SCHEDULED', 'INSPECTION_PASSED',
    'INSPECTION_FAILED', 'LICENSE_FEE_RECEIVED', 'LICENSE_ISSUED',
    'APPLICATION_REJECTED', 'APPLICATION_WITHDRAWN', 'AIP_EXPIRED',
    'SLA_CLOCK_PAUSED', 'SLA_CLOCK_RESUMED', 'CONDITION_ADDED',
    'CONDITION_FULFILLED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERSION_ADDED',
    'USER_CREATED', 'USER_DEACTIVATED', 'REVIEWER_REASSIGNED'
);
```

### `users`

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(30),
    organisation  VARCHAR(255),
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `applications`

```sql
CREATE TABLE applications (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number         VARCHAR(30) UNIQUE NOT NULL,  -- BNR-2025-0001
    applicant_id             UUID NOT NULL REFERENCES users(id),
    license_type             license_type NOT NULL,
    institution_name         VARCHAR(255) NOT NULL,
    proposed_name            VARCHAR(255),                 -- name before approval
    proposed_capital_rwf     BIGINT NOT NULL,
    registered_country       VARCHAR(100) NOT NULL DEFAULT 'Rwanda',
    head_office_address      TEXT,
    is_foreign_institution   BOOLEAN NOT NULL DEFAULT FALSE,
    home_supervisor_name     VARCHAR(255),   -- for foreign banks: home regulator
    home_supervisor_email    VARCHAR(255),   -- for foreign banks: contact for NoOI

    status                   application_status NOT NULL DEFAULT 'DRAFT',
    version                  INTEGER NOT NULL DEFAULT 1,   -- optimistic lock

    -- Assigned staff (one per role, set at different stages)
    case_manager_id          UUID REFERENCES users(id),
    compliance_officer_id    UUID REFERENCES users(id),
    technical_reviewer_id    UUID REFERENCES users(id),
    legal_officer_id         UUID REFERENCES users(id),
    inspection_officer_id    UUID REFERENCES users(id),

    -- SLA clock
    sla_working_days_target  INTEGER NOT NULL DEFAULT 90,
    sla_clock_started_at     TIMESTAMPTZ,
    sla_clock_paused_at      TIMESTAMPTZ,
    sla_working_days_used    INTEGER NOT NULL DEFAULT 0,
    sla_paused_reason        TEXT,

    -- AIP and organization period
    aip_granted_at           TIMESTAMPTZ,
    aip_granted_by           UUID REFERENCES users(id),
    aip_expires_at           TIMESTAMPTZ,    -- aip_granted_at + 12 months
    organization_deadline    TIMESTAMPTZ,    -- same as aip_expires_at

    -- Final license
    license_fee_paid_at      TIMESTAMPTZ,
    license_issued_at        TIMESTAMPTZ,
    license_issued_by        UUID REFERENCES users(id),
    license_number           VARCHAR(30) UNIQUE,   -- BNR/CB/2025/001

    -- Review notes
    completeness_notes       TEXT,
    technical_review_notes   TEXT,
    legal_review_notes       TEXT,
    rejection_reason         TEXT,

    final_status_at          TIMESTAMPTZ,
    submitted_at             TIMESTAMPTZ,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Separation of duties: no one who reviewed can issue the license
    CONSTRAINT chk_reviewer_not_licensor
        CHECK (license_issued_by IS DISTINCT FROM technical_reviewer_id),
    CONSTRAINT chk_compliance_not_licensor
        CHECK (license_issued_by IS DISTINCT FROM compliance_officer_id)
);

CREATE INDEX idx_applications_status    ON applications(status);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
CREATE INDEX idx_applications_ref       ON applications(reference_number);
CREATE INDEX idx_applications_sla       ON applications(sla_clock_started_at)
    WHERE status NOT IN ('LICENSED', 'REJECTED', 'WITHDRAWN', 'AIP_EXPIRED');
```

**Why `home_supervisor_name`?** When a foreign bank applies to open a branch in Rwanda, BNR is required to issue a Notice of Intent to the home country regulator and obtain a no-objection confirmation. This is a standard step in host-country bank licensing. The field stores the contact information needed to do this.

**Why `license_number`?** The final license is a numbered document referenced in the public license register (`BNR/CB/2025/001`). It differs from the application `reference_number`, which tracks the process. An institution may have multiple applications over time (license renewals, expansions), each with its own reference number, but the license number is the permanent public identifier.

### `license_conditions`

```sql
CREATE TABLE license_conditions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id   UUID NOT NULL REFERENCES applications(id),
    condition_text   TEXT NOT NULL,
    category         VARCHAR(100) NOT NULL,  -- 'CAPITAL', 'GOVERNANCE', 'IT', 'PREMISES', 'AML'
    is_fulfilled     BOOLEAN NOT NULL DEFAULT FALSE,
    fulfilled_at     TIMESTAMPTZ,
    fulfilled_by     UUID REFERENCES users(id),
    fulfillment_note TEXT,
    due_date         TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Every AIP comes with explicit conditions. These are tracked individually — inspectors mark them fulfilled or outstanding. The pre-opening inspection cannot pass until all conditions are marked fulfilled and verified on-site.

### `fit_and_proper_assessments`

```sql
CREATE TABLE fit_and_proper_assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id      UUID NOT NULL REFERENCES applications(id),
    assessed_by         UUID NOT NULL REFERENCES users(id),
    individual_name     VARCHAR(255) NOT NULL,
    individual_role     VARCHAR(100) NOT NULL,  -- 'DIRECTOR', 'CEO', 'SHAREHOLDER_5PCT', etc.
    shareholding_pct    DECIMAL(5,2),           -- for shareholders
    national_id         VARCHAR(100),
    nationality         VARCHAR(100),

    -- Assessment dimensions
    criminal_record_clear   BOOLEAN,
    financial_history_clear BOOLEAN,
    qualifications_adequate BOOLEAN,
    no_conflict_of_interest BOOLEAN,
    interview_conducted     BOOLEAN NOT NULL DEFAULT FALSE,
    interview_date          DATE,
    interview_notes         TEXT,

    outcome             VARCHAR(20),   -- 'FIT', 'NOT_FIT', 'PENDING'
    outcome_notes       TEXT,
    assessed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Why a separate table per individual?** A commercial bank application may have 10+ directors and 20+ significant shareholders. Each is assessed individually. An application cannot proceed if any one of them is found not fit and proper.

### `inspection_reports`

```sql
CREATE TABLE inspection_reports (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id       UUID NOT NULL REFERENCES applications(id),
    inspection_officer_id UUID NOT NULL REFERENCES users(id),
    scheduled_date       DATE NOT NULL,
    conducted_date       DATE,
    premises_verified    BOOLEAN,
    capital_verified     BOOLEAN,
    capital_amount_rwf   BIGINT,
    it_systems_verified  BOOLEAN,
    aml_framework_ok     BOOLEAN,
    staffing_adequate    BOOLEAN,
    policy_manuals_ok    BOOLEAN,
    overall_outcome      VARCHAR(20),   -- 'PASSED', 'FAILED', 'DEFERRED'
    findings             TEXT,
    conditions_outstanding JSONB,       -- list of condition IDs still not met
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `application_documents`

```sql
CREATE TABLE application_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications(id),
    document_type   VARCHAR(100) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    stored_path     VARCHAR(500) NOT NULL,
    mime_type       VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes <= 5242880),
    version         INTEGER NOT NULL DEFAULT 1,
    is_current      BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by     UUID NOT NULL REFERENCES users(id),
    upload_stage    application_status NOT NULL,  -- which stage was this uploaded in?
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (application_id, document_type, version)
);
```

**Why `upload_stage`?** Documents uploaded during `ORGANIZATION_PERIOD` (e.g., capital deposit proof) are distinct from those uploaded at `SUBMITTED`. This makes it trivial to show an inspector exactly what was available at each stage of the process.

### `audit.log` (append-only, separate schema)

```sql
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.log (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id   UUID,
    actor_id         UUID NOT NULL,
    actor_role       user_role NOT NULL,
    action           audit_action NOT NULL,
    description      TEXT,
    previous_state   JSONB,
    new_state        JSONB,
    ip_address       INET,
    user_agent       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_application ON audit.log(application_id);
CREATE INDEX idx_audit_actor       ON audit.log(actor_id);
CREATE INDEX idx_audit_created     ON audit.log(created_at DESC);
CREATE INDEX idx_audit_action      ON audit.log(action);
```

No `updated_at`. No `deleted_at`. The table has no update or delete path at any level.

### JPA — key patterns

```java
@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Version
    private Integer version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status;

    @Column(name = "aip_expires_at")
    private Instant aipExpiresAt;

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL)
    private List conditions = new ArrayList<>();

    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL)
    private List fitAndProperAssessments = new ArrayList<>();
}

@Entity
@Table(name = "log", schema = "audit")
@Immutable
public class AuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(insertable = true, updatable = false)
    private Instant createdAt;
}
```

---

## 6. State Machine

### Complete state graph

```
DRAFT
  ├─► NAME_APPROVAL_PENDING   (applicant requests name approval)
  └─► WITHDRAWN

NAME_APPROVAL_PENDING
  ├─► NAME_APPROVED           (BNR approves name)
  └─► DRAFT                   (name rejected → applicant revises and re-requests)

NAME_APPROVED
  └─► SUBMITTED               (formal application lodged + application fee paid)

SUBMITTED
  ├─► COMPLETENESS_CHECK      (compliance officer begins document review)
  └─► WITHDRAWN               (only before completeness check starts)

COMPLETENESS_CHECK
  ├─► INCOMPLETE              (missing documents — clock paused)
  └─► CASE_ASSIGNED           (complete — case manager assigned, clock starts)

INCOMPLETE
  └─► SUBMITTED               (applicant submits missing documents)

CASE_ASSIGNED
  └─► FIT_AND_PROPER_ASSESSMENT

FIT_AND_PROPER_ASSESSMENT
  ├─► ADDITIONAL_INFO_REQUESTED  (F&P issues found, applicant must respond)
  └─► TECHNICAL_REVIEW           (F&P passed for all individuals)

ADDITIONAL_INFO_REQUESTED
  └─► (previous state)           (applicant responds → returns to requesting state)

TECHNICAL_REVIEW
  ├─► ADDITIONAL_INFO_REQUESTED  (reviewer has questions)
  └─► LEGAL_REVIEW               (technical review complete)

LEGAL_REVIEW
  ├─► ADDITIONAL_INFO_REQUESTED  (legal concerns)
  └─► COMMITTEE_DELIBERATION     (legal sign-off)

COMMITTEE_DELIBERATION
  ├─► APPROVAL_IN_PRINCIPLE      (committee votes to grant AIP + conditions)
  └─► REJECTED                   (committee denies — terminal)

APPROVAL_IN_PRINCIPLE
  └─► ORGANIZATION_PERIOD        (12-month clock starts for applicant setup)

ORGANIZATION_PERIOD
  ├─► PRE_LICENSE_INSPECTION     (applicant requests inspection when ready)
  └─► AIP_EXPIRED                (12-month deadline missed — terminal)

PRE_LICENSE_INSPECTION
  ├─► INSPECTION_FAILED          (conditions not met — returns to ORGANIZATION_PERIOD)
  └─► LICENSE_FEE_PENDING        (inspection passed)

INSPECTION_FAILED
  └─► ORGANIZATION_PERIOD        (applicant continues setup)

LICENSE_FEE_PENDING
  └─► LICENSED                   (fee confirmed, license issued — terminal)

REJECTED     — terminal
WITHDRAWN    — terminal
AIP_EXPIRED  — terminal
LICENSED     — terminal
```

### Enforcement

```java
@Component
public class StateMachineService {

    private static final Map> TRANSITIONS = Map.ofEntries(
        entry(DRAFT,                     Set.of(NAME_APPROVAL_PENDING, WITHDRAWN)),
        entry(NAME_APPROVAL_PENDING,     Set.of(NAME_APPROVED, DRAFT)),
        entry(NAME_APPROVED,             Set.of(SUBMITTED)),
        entry(SUBMITTED,                 Set.of(COMPLETENESS_CHECK, WITHDRAWN)),
        entry(COMPLETENESS_CHECK,        Set.of(INCOMPLETE, CASE_ASSIGNED)),
        entry(INCOMPLETE,                Set.of(SUBMITTED)),
        entry(CASE_ASSIGNED,             Set.of(FIT_AND_PROPER_ASSESSMENT)),
        entry(FIT_AND_PROPER_ASSESSMENT, Set.of(ADDITIONAL_INFO_REQUESTED, TECHNICAL_REVIEW)),
        entry(ADDITIONAL_INFO_REQUESTED, Set.of(FIT_AND_PROPER_ASSESSMENT, TECHNICAL_REVIEW, LEGAL_REVIEW)),
        entry(TECHNICAL_REVIEW,          Set.of(ADDITIONAL_INFO_REQUESTED, LEGAL_REVIEW)),
        entry(LEGAL_REVIEW,              Set.of(ADDITIONAL_INFO_REQUESTED, COMMITTEE_DELIBERATION)),
        entry(COMMITTEE_DELIBERATION,    Set.of(APPROVAL_IN_PRINCIPLE, REJECTED)),
        entry(APPROVAL_IN_PRINCIPLE,     Set.of(ORGANIZATION_PERIOD)),
        entry(ORGANIZATION_PERIOD,       Set.of(PRE_LICENSE_INSPECTION, AIP_EXPIRED)),
        entry(PRE_LICENSE_INSPECTION,    Set.of(INSPECTION_FAILED, LICENSE_FEE_PENDING)),
        entry(INSPECTION_FAILED,         Set.of(ORGANIZATION_PERIOD)),
        entry(LICENSE_FEE_PENDING,       Set.of(LICENSED))
    );

    public void assertTransition(ApplicationStatus from, ApplicationStatus to) {
        if (!TRANSITIONS.getOrDefault(from, Set.of()).contains(to)) {
            throw new InvalidStateTransitionException(from, to);
        }
    }
}
```

Invalid transitions return `409 Conflict`. Terminal states (`LICENSED`, `REJECTED`, `WITHDRAWN`, `AIP_EXPIRED`) are not in the map — any transition from them produces an empty set and throws.

### Design decisions in the state machine

**Why `ADDITIONAL_INFO_REQUESTED` returns to its originating state?** In real licensing, the clock pauses during information requests and resumes where it left off. The requesting stage (F&P, Technical, Legal) is the context holder for the outstanding questions. Re-entering the same stage on response allows the same reviewer to continue their assessment without handing off.

**Why `WITHDRAWN` is only possible before `AIP`?** Once AIP is granted, the applicant has already consumed significant BNR resources and made representations that BNR has acted on. Post-AIP, a withdrawal is treated as an expiry or rejection, not a voluntary withdrawal. This mirrors the approach taken by the Central Bank of Kenya and the ECB.

**Why `INSPECTION_FAILED` returns to `ORGANIZATION_PERIOD` rather than being terminal?** One failed inspection is not a license denial. The applicant is given a reasonable opportunity to rectify the findings. However, a second failed inspection, or failure to remedy within a defined period, escalates to the committee and can result in AIP revocation. This is documented in the `Out of Scope` section as a v2 feature.

---

## 7. Roles & Permission Matrix

### Role definitions

| Role | Real-world mapping | Scope |
|---|---|---|
| `APPLICANT` | Institution's representative | Own applications only |
| `CASE_MANAGER` | BNR Licensing Department — coordinator | All applications assigned to them |
| `COMPLIANCE_OFFICER` | BNR Licensing — completeness check | All submitted applications |
| `TECHNICAL_REVIEWER` | BNR Licensing — senior economist/analyst | Assigned applications |
| `FIT_AND_PROPER_OFFICER` | BNR — due diligence specialist | All F&P-stage applications |
| `LEGAL_OFFICER` | BNR Legal Division | Applications in legal review |
| `INSPECTION_OFFICER` | BNR Examination — field team | Assigned inspections |
| `LICENSING_COMMITTEE` | BNR Board sub-committee member | Committee deliberation stage |
| `GOVERNOR_DELEGATE` | DG or designated authority | AIP-passed applications |
| `ADMIN` | BNR IT / Licensing Administration | User management, reassignment |
| `AUDITOR` | BNR Internal Audit / External Audit | Read-only, everything |

### Permission matrix (selected, critical actions)

| Action | APPLICANT | COMP. | TECH. | LEGAL | INSPECT. | COMMITTEE | GOV_DEL | ADMIN | AUDITOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Create / submit application | ✅ own | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Request name approval | ✅ own | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve/reject name | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Completeness check | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign case manager | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Conduct F&P assessment | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| (F&P officer only) | FPO ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Conduct technical review | ❌ | ❌ | ✅ (assigned) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Conduct legal review | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vote on AIP (committee) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Issue final license | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (not if reviewed) | ❌ | ❌ |
| Schedule inspection | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit inspection report | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload documents | ✅ (writable stages) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add AIP conditions | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Mark condition fulfilled | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all applications | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View audit log | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View own audit trail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modify audit log | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Override terminal decision | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Separation of duties — enforcement

The hard rule: *no one who participated in reviewing an application can issue the final license.*

This extends beyond a single role. The `GOVERNOR_DELEGATE` (or whoever issues the license) must not be the same individual who acted as `TECHNICAL_REVIEWER`, `COMPLIANCE_OFFICER`, or `LEGAL_OFFICER` on the same application.

**Layer 1 — Database constraint:**
```sql
CONSTRAINT chk_reviewer_not_licensor
    CHECK (license_issued_by IS DISTINCT FROM technical_reviewer_id),
CONSTRAINT chk_compliance_not_licensor
    CHECK (license_issued_by IS DISTINCT FROM compliance_officer_id)
```

**Layer 2 — Service layer:**
```java
private void assertSeparationOfDuties(Application app, User licensor) {
    Set reviewers = Set.of(
        app.getTechnicalReviewerId(),
        app.getComplianceOfficerId(),
        app.getLegalOfficerId()
    ).stream().filter(Objects::nonNull).collect(Collectors.toSet());

    if (reviewers.contains(licensor.getId())) {
        throw new SeparationOfDutiesException(licensor.getEmail());
    }
}
```

**Layer 3 — Spring Security `@PreAuthorize`:**
```java
@PreAuthorize("hasRole('GOVERNOR_DELEGATE') and @separationGuard.canIssueLicense(#id, authentication)")
public ResponseEntity issueLicense(@PathVariable UUID id, ...) { ... }
```

---

## 8. Licensing Process — Stage by Stage

### Stage 0: Pre-application (informal, not modeled as a system state)

Before any formal submission, BNR encourages prospective applicants to consult with the Licensing Department. This informal engagement is common practice across central banks globally — it surfaces misunderstandings early and prevents incomplete formal applications. In this system, BNR staff can create a `DRAFT` application on behalf of an applicant who has had a pre-application meeting, which is the entry point into the tracked workflow.

### Stage 1: Name approval (`NAME_APPROVAL_PENDING` → `NAME_APPROVED`)

The applicant requests BNR approval for their proposed institution name. A `COMPLIANCE_OFFICER` reviews it against the existing licensed institution register and relevant naming regulations. If the name is approved, the application moves to `NAME_APPROVED`. If rejected, the applicant revises and re-requests without creating a new application.

**System behavior:** When an application enters `NAME_APPROVED`, the applicant is unlocked to complete the formal application form and submit it.

### Stage 2: Formal submission (`NAME_APPROVED` → `SUBMITTED`)

The applicant submits the complete application with all required documents and pays the non-refundable application fee. `submitted_at` is stamped and the application enters the BNR queue.

**Required document checklist by license type:**
```java
public static final Map> REQUIRED_DOCUMENTS = Map.of(
    COMMERCIAL_BANK, List.of(
        "BUSINESS_PLAN_3_YEAR", "FEASIBILITY_STUDY",
        "SHAREHOLDERS_REGISTRY", "PROOF_OF_FUNDS_SOURCE",
        "GOVERNANCE_CHARTER", "ARTICLES_OF_INCORPORATION",
        "AML_CFT_POLICY", "IT_SECURITY_POLICY",
        "RISK_MANAGEMENT_FRAMEWORK", "INTERNAL_AUDIT_CHARTER",
        "FIT_AND_PROPER_DECLARATIONS_ALL_DIRECTORS",
        "CREDIT_INFORMATION_BUREAU_CLEARANCE",
        "TAX_CLEARANCE_CERTIFICATE"
    ),
    FOREX_BUREAU, List.of(
        "BUSINESS_PLAN_3_YEAR", "AML_CFT_COMPLIANCE_MANUAL",
        "PREMISES_OWNERSHIP_OR_LEASE", "ARTICLES_OF_INCORPORATION",
        "FIT_AND_PROPER_DECLARATIONS_ALL_DIRECTORS",
        "TAX_CLEARANCE_CERTIFICATE"
    )
    // ... etc per license type
);
```

### Stage 3: Completeness check (`SUBMITTED` → `COMPLETENESS_CHECK`)

A `COMPLIANCE_OFFICER` verifies that every required document is present, that the proposed capital meets the statutory minimum for the license type, and that the application form is complete. This is not a quality assessment — purely a completeness gate.

**Capital adequacy check:**
```java
public static final Map MIN_CAPITAL_RWF = Map.of(
    COMMERCIAL_BANK,                   5_000_000_000L,
    MICROFINANCE_INSTITUTION_TIER1,      500_000_000L,
    MICROFINANCE_INSTITUTION_TIER2,      150_000_000L,
    SAVINGS_CREDIT_COOPERATIVE,           50_000_000L,
    FOREX_BUREAU,                         20_000_000L,
    PAYMENT_SERVICE_PROVIDER,            200_000_000L,
    DEVELOPMENT_FINANCE_INSTITUTION,   2_000_000_000L,
    REPRESENTATIVE_OFFICE,                10_000_000L
);
```

If the proposed capital is below the statutory minimum, completeness check fails immediately with a specific error message — no need to progress to technical review.

**SLA clock starts** when completeness is passed and the case manager is assigned.

### Stage 4: Case manager assignment (`COMPLETENESS_CHECK` → `CASE_ASSIGNED`)

A dedicated `CASE_MANAGER` is assigned as the single point of contact between the applicant and all BNR departments for the duration of the review. This mirrors the approach of the Central Bank of Ireland, which assigns a case manager to every application at the start of the formal assessment phase. All applicant communications should reference the case manager.

### Stage 5: Fit-and-proper assessment (`CASE_ASSIGNED` → `FIT_AND_PROPER_ASSESSMENT`)

Every individual listed in `FIT_AND_PROPER_DECLARATIONS_ALL_DIRECTORS` is individually assessed by a `FIT_AND_PROPER_OFFICER`. A `FitAndProperAssessment` record is created for each. For each individual, BNR:

- Verifies national/international criminal records clearance
- Reviews credit history and absence of financial misconduct
- Confirms qualifications meet minimum standards for the proposed role
- Checks for conflicts of interest
- Conducts an in-person interview for executive roles (CEO, CFO, Board Chair)
- For shareholders with >10%: enhanced due diligence on source of funds

For **foreign bank** applications, BNR also issues a Notice of Intent to the home country supervisor and awaits confirmation that the institution is in good standing. The `home_supervisor_name` and `home_supervisor_email` fields support this communication.

The assessment cannot be completed until every individual's `FitAndProperAssessment` has `outcome = 'FIT'`. A single `NOT_FIT` outcome triggers `ADDITIONAL_INFO_REQUESTED` — the applicant must either replace the individual or provide evidence addressing BNR's concerns.

### Stage 6: Technical review (`FIT_AND_PROPER_ASSESSMENT` → `TECHNICAL_REVIEW`)

A `TECHNICAL_REVIEWER` (senior economist or banking analyst) conducts a deep assessment:

- Business plan viability — revenue projections, market demand, competitive positioning
- Capital adequacy — not just meeting the minimum, but adequacy relative to projected risk profile
- Risk management framework — credit risk, operational risk, liquidity risk, FX risk policies
- IT systems and data security architecture
- AML/CFT framework assessed against FATF recommendations
- Governance structures per BNR Corporate Governance Guidelines (2019)

The reviewer may request additional information multiple times. Each request pauses the SLA clock.

### Stage 7: Legal review (`TECHNICAL_REVIEW` → `LEGAL_REVIEW`)

BNR's `LEGAL_OFFICER` reviews:

- Articles of incorporation and governance charter for compliance with Rwanda Company Law
- Shareholder agreements for provisions that may conflict with BNR supervisory authority
- Proposed bylaws for compliance with BNR licensing regulations
- For foreign banks: legal validity of the proposed branch structure under both Rwandan law and home country law

### Stage 8: Committee deliberation (`LEGAL_REVIEW` → `COMMITTEE_DELIBERATION`)

The BNR Licensing Committee — typically comprising senior BNR officials holding `LICENSING_COMMITTEE` role — receives the complete assessment package and votes on whether to grant AIP. The committee's decision must be recorded in the audit trail with each member's vote.

**Deliberation outcome options:**
- Grant AIP (with conditions listed)
- Deny (with written reasons, grounds for appeal noted)
- Request one final round of specific clarification before deciding

### Stage 9: Approval-in-Principle (`COMMITTEE_DELIBERATION` → `APPROVAL_IN_PRINCIPLE`)

If AIP is granted:
- `aip_granted_at` is stamped
- `aip_expires_at` = `aip_granted_at + 12 months`
- All conditions attached by the committee are created as `LicenseCondition` records
- A scheduled job runs nightly to check for approaching AIP expiry (90 days, 30 days, 7 days warnings)
- The applicant is notified in writing of the AIP decision and the list of conditions

The applicant **cannot begin banking operations** at this stage. The AIP is a permission to organize, not to operate.

### Stage 10: Organization period (`APPROVAL_IN_PRINCIPLE` → `ORGANIZATION_PERIOD`)

Within 12 months, the applicant must:
1. Inject the required capital into a designated escrow/suspense account at BNR
2. Establish and equip physical banking premises
3. Hire and train all key staff
4. Implement approved IT systems and banking software
5. Develop and finalize all required policy manuals
6. Obtain any additional regulatory approvals (e.g., RISA for IT systems, RDB for incorporation if not yet done)
7. Complete fulfillment of each `LicenseCondition`

Progress updates and additional documents are submitted by the applicant during this period. Major changes (ownership structure, capital source, key personnel) must be reported to BNR within 15 days.

**AIP expiry:** A scheduled Spring `@Scheduled` task runs daily to identify applications where `aip_expires_at < NOW()` and status is still `ORGANIZATION_PERIOD`. These are automatically transitioned to `AIP_EXPIRED` with an audit entry. The applicant must start a new application.

### Stage 11: Pre-opening inspection (`ORGANIZATION_PERIOD` → `PRE_LICENSE_INSPECTION`)

When the applicant believes all conditions have been met, they formally request the pre-opening inspection. An `INSPECTION_OFFICER` is assigned and an `InspectionReport` is created with `scheduled_date`. The officer visits the premises and physically verifies each condition.

The inspection is a structured checklist:
- Capital confirmed deposited and verified (amount, account, deposit slip)
- Premises physically inspected (location, security, vault, public counters)
- IT systems demonstrated live (core banking, AML monitoring, reporting systems)
- Key staff present and credentials verified
- Policy manuals reviewed (AML, credit, operational risk, HR)
- All `LicenseCondition` records verified fulfilled

If any item fails: `INSPECTION_FAILED` → `ORGANIZATION_PERIOD`, findings documented, applicant given a deadline to rectify.

### Stage 12: Final license (`LICENSE_FEE_PENDING` → `LICENSED`)

Once inspection passes, the applicant pays the final licensing fee. Upon payment confirmation, the `GOVERNOR_DELEGATE` issues the license:

- `license_issued_at` stamped
- `license_number` generated (`BNR/CB/2025/001`)
- Application enters `LICENSED` — permanent terminal state
- Institution is added to the public license register

The license number follows the format: `BNR/{type_code}/{year}/{sequence}` where `type_code` = `CB` for commercial bank, `MF` for microfinance, `FB` for forex bureau, etc.

---

## 9. Authentication & Authorization

### JWT design

```
Access token:  15 minutes  (httpOnly not possible for Bearer, so keep short)
Refresh token: 7 days      (httpOnly cookie — not JS-accessible)
```

**Token payload:**
```json
{
  "sub": "uuid",
  "email": "reviewer@bnr.rw",
  "role": "TECHNICAL_REVIEWER",
  "iat": 1715000000,
  "exp": 1715000900
}
```

Role embedded in the token eliminates a DB lookup on every request. The 15-minute expiry is the key security control: a stolen token is only usable for 15 minutes.

**Trade-off acknowledged:** Instant revocation requires a blocklist (Redis). Without it, a deactivated user retains access for up to 15 minutes. Mitigation: `is_active` checked on every refresh token exchange. With more time: Redis-based blocklist.

### Spring Security configuration

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/license-register").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/audit/**").hasAnyRole("AUDITOR", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

---

## 10. Audit Trail — Tamper-Proof Design

### Four-layer append-only enforcement

**Layer 1 — PostgreSQL schema permissions (strongest guarantee):**
```sql
REVOKE ALL ON ALL TABLES IN SCHEMA audit FROM bnr_app;
REVOKE ALL ON SCHEMA audit FROM bnr_app;
GRANT USAGE ON SCHEMA audit TO bnr_app;

CREATE OR REPLACE FUNCTION audit.record_event(
    p_application_id UUID,
    p_actor_id       UUID,
    p_actor_role     user_role,
    p_action         audit_action,
    p_description    TEXT,
    p_prev_state     JSONB,
    p_new_state      JSONB,
    p_ip_address     INET,
    p_user_agent     TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = audit
AS $$
BEGIN
    INSERT INTO audit.log (application_id, actor_id, actor_role, action, description,
                           previous_state, new_state, ip_address, user_agent)
    VALUES (p_application_id, p_actor_id, p_actor_role, p_action, p_description,
            p_prev_state, p_new_state, p_ip_address, p_user_agent);
END;
$$;

GRANT EXECUTE ON FUNCTION audit.record_event TO bnr_app;
```

The application database user can call the function. It cannot write to the table directly, cannot update, cannot delete, cannot truncate. Even if the application is fully compromised, the audit log cannot be altered.

**Layer 2 — JPA `@Immutable`:** Hibernate will never issue an `UPDATE` or `DELETE` SQL for `AuditEntry` entities.

**Layer 3 — Repository interface (no mutation methods exist):**
```java
public interface AuditRepository extends JpaRepository {
    Page findByApplicationIdOrderByCreatedAtDesc(UUID applicationId, Pageable pageable);
    Page findAllByOrderByCreatedAtDesc(Pageable pageable);
}
```

**Layer 4 — Atomic transaction:**
```java
@Transactional
public void transition(UUID applicationId, ApplicationStatus targetStatus, User actor, HttpServletRequest req) {
    Application app = applicationRepository.findByIdWithLock(applicationId).orElseThrow();

    stateMachineService.assertTransition(app.getStatus(), targetStatus);

    ApplicationStatus previousStatus = app.getStatus();
    app.setStatus(targetStatus);
    applicationRepository.save(app);

    slaClockService.onTransition(app, previousStatus, targetStatus);

    auditService.record(app.getId(), actor, targetStatus.toAuditAction(),
        toJsonb(previousStatus), toJsonb(targetStatus), req);
}
```

State change and audit entry succeed together or both roll back. There is no code path that changes state without an audit entry.

### What every audit entry captures

- `actor_id` + `actor_role` — who and in what capacity
- `action` — from the `audit_action` enum (never free text — free text is ambiguous in legal proceedings)
- `previous_state` + `new_state` — full JSONB snapshots of the application, not just diffs
- `ip_address` + `user_agent` — forensic provenance
- `created_at` — server-set, never client-provided

**Future enhancement (documented):** SHA-256 hash chain. Each entry hashes `previous_entry_hash || current_entry_json`. Any post-hoc modification of any record breaks the chain and is immediately detectable. This would make the log suitable as self-verifying legal evidence without requiring BNR to testify about its database security configuration.

---

## 11. Concurrency Control

### Optimistic locking with `@Version`

Every `applications` row has a `version` integer managed by Hibernate.

**Scenario:** Two BNR officers simultaneously attempt to move the same application from `SUBMITTED` to `COMPLETENESS_CHECK`:

1. Officer A reads application (version = 3)
2. Officer B reads application (version = 3)
3. Officer A submits: `UPDATE applications SET status = 'COMPLETENESS_CHECK', version = 4 WHERE id = ? AND version = 3` → 1 row affected → success
4. Officer B submits: `UPDATE applications SET status = 'COMPLETENESS_CHECK', version = 4 WHERE id = ? AND version = 3` → 0 rows affected → `OptimisticLockException`

Spring maps this to a `409 Conflict`:
```json
{
  "error": {
    "code": "CONCURRENT_MODIFICATION",
    "message": "This application was modified by another user. Please reload and retry.",
    "details": { "applicationId": "..." }
  }
}
```

**Why not pessimistic locking?** A technical reviewer may spend 45 minutes reading documents before clicking "Complete Review." A pessimistic lock held for 45 minutes exhausts the connection pool under any meaningful user load. The conflict rate in this domain is extremely low — optimistic locking is correct.

### Concurrency test

```java
@Test
void concurrentTransitionOnlyOneSucceeds() throws InterruptedException {
    Application app = createApplicationInStatus(SUBMITTED);
    CountDownLatch ready = new CountDownLatch(2);
    CountDownLatch start = new CountDownLatch(1);
    AtomicInteger successes = new AtomicInteger(0);
    AtomicInteger conflicts = new AtomicInteger(0);

    Runnable attempt = () -> {
        try {
            ready.countDown();
            start.await();
            applicationService.startCompletenessCheck(app.getId(), complianceOfficer, mockReq);
            successes.incrementAndGet();
        } catch (OptimisticLockConflictException e) {
            conflicts.incrementAndGet();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    };

    Thread t1 = new Thread(attempt);
    Thread t2 = new Thread(attempt);
    t1.start(); t2.start();
    ready.await();
    start.countDown();
    t1.join(); t2.join();

    assertThat(successes.get()).isEqualTo(1);
    assertThat(conflicts.get()).isEqualTo(1);

    Application refreshed = applicationRepository.findById(app.getId()).orElseThrow();
    assertThat(refreshed.getStatus()).isEqualTo(COMPLETENESS_CHECK);
    assertThat(refreshed.getVersion()).isEqualTo(2);
}
```

---

## 12. Document Handling & Versioning

### Upload flow

```
1. POST /api/applications/{id}/documents (multipart/form-data)
2. Service validates: file size ≤ 5 MB, MIME type in allowlist, application in writable state
3. If document_type already exists for this application:
   a. SET previous record is_current = false
   b. INSERT new record with version = previous_version + 1
4. File written to: storage/{applicationId}/{uuid}.{extension}
5. Metadata saved in application_documents with upload_stage = current application status
6. Audit entry: DOCUMENT_UPLOADED or DOCUMENT_VERSION_ADDED
```

**Writable states:** `DRAFT`, `NAME_APPROVED`, `SUBMITTED`, `INCOMPLETE`, `ADDITIONAL_INFO_REQUESTED`, `ORGANIZATION_PERIOD`

**MIME type allowlist:** `application/pdf`, `image/jpeg`, `image/png`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Why `upload_stage`?** Capital deposit proof uploaded during `ORGANIZATION_PERIOD` must be distinguished from capital projections uploaded at `SUBMITTED`. Inspectors need to know what was available at each stage. This also makes it possible to show the inspection officer only the documents uploaded during the organization period.

### Version history query

```java
public List getDocumentHistory(UUID applicationId, String documentType) {
    return documentRepository
        .findByApplicationIdAndDocumentTypeOrderByVersionDesc(applicationId, documentType)
        .stream()
        .map(documentMapper::toResponse)
        .collect(toList());
}
```

Old versions are never deleted. This is not configurable. Version 1 of a fraudulent document remains on disk and in the database for the lifetime of the application.

---

## 13. SLA Clock — Statutory Timeline Tracking

Central banks make binding commitments about assessment timelines. BNR's target is 90 working days from the start of formal assessment (case assignment) to AIP decision. The clock pauses during information requests.

### SLA clock fields on `applications`

```sql
sla_clock_started_at   TIMESTAMPTZ,  -- set when CASE_ASSIGNED
sla_clock_paused_at    TIMESTAMPTZ,  -- set when ADDITIONAL_INFO_REQUESTED
sla_working_days_used  INTEGER NOT NULL DEFAULT 0,
sla_paused_reason      TEXT,
sla_working_days_target INTEGER NOT NULL DEFAULT 90
```

### SLA clock service

```java
@Service
public class SlaClockService {

    public void onTransition(Application app, ApplicationStatus from, ApplicationStatus to) {
        if (to == CASE_ASSIGNED) {
            app.setSlaClockStartedAt(Instant.now());
        }
        if (to == ADDITIONAL_INFO_REQUESTED) {
            pauseClock(app, "Awaiting additional information from applicant");
        }
        if (from == ADDITIONAL_INFO_REQUESTED && to != ADDITIONAL_INFO_REQUESTED) {
            resumeClock(app);
        }
        if (isTerminal(to)) {
            finalizeClockUsage(app);
        }
    }

    private void pauseClock(Application app, String reason) {
        updateWorkingDaysUsed(app);
        app.setSlaClockPausedAt(Instant.now());
        app.setSlaClausedReason(reason);
    }

    private void resumeClock(Application app) {
        app.setSlaClockPausedAt(null);
        app.setSlaClausedReason(null);
    }

    public int getRemainingWorkingDays(Application app) {
        int used = app.getSlaWorkingDaysUsed();
        if (app.getSlaClockPausedAt() == null && app.getSlaClockStartedAt() != null) {
            used += workingDaysBetween(app.getSlaClockStartedAt(), Instant.now());
        }
        return app.getSlaWorkingDaysTarget() - used;
    }
}
```

**Scheduled expiry checks:**
```java
@Scheduled(cron = "0 0 7 * * MON-FRI")  // 7am every working day
public void checkAipExpiry() {
    List expiring = applicationRepository
        .findByStatusAndAipExpiresAtBefore(ORGANIZATION_PERIOD, Instant.now());

    expiring.forEach(app -> {
        applicationService.expireAip(app, systemUser);
        notificationService.notifyApplicantAipExpired(app);
    });
}
```

---

## 14. API Design

### Endpoint overview

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/applications                              (role-filtered)
POST   /api/applications                             (APPLICANT)
GET    /api/applications/{id}

POST   /api/applications/{id}/name-approval          (APPLICANT: request name approval)
POST   /api/applications/{id}/name-approval/approve  (COMPLIANCE_OFFICER)
POST   /api/applications/{id}/name-approval/reject   (COMPLIANCE_OFFICER)

POST   /api/applications/{id}/submit                 (APPLICANT)
POST   /api/applications/{id}/withdraw               (APPLICANT, before AIP)

POST   /api/applications/{id}/completeness/start     (COMPLIANCE_OFFICER)
POST   /api/applications/{id}/completeness/pass      (COMPLIANCE_OFFICER)
POST   /api/applications/{id}/completeness/fail      (COMPLIANCE_OFFICER)

POST   /api/applications/{id}/case-manager           (COMPLIANCE_OFFICER, ADMIN: assign)

GET    /api/applications/{id}/fit-and-proper         (all BNR roles)
POST   /api/applications/{id}/fit-and-proper         (FIT_AND_PROPER_OFFICER: create assessment)
PATCH  /api/applications/{id}/fit-and-proper/{aid}   (FIT_AND_PROPER_OFFICER: update)
POST   /api/applications/{id}/fit-and-proper/complete (FIT_AND_PROPER_OFFICER: all done)

POST   /api/applications/{id}/review/start           (TECHNICAL_REVIEWER)
POST   /api/applications/{id}/review/complete        (TECHNICAL_REVIEWER)
POST   /api/applications/{id}/review/request-info    (TECHNICAL_REVIEWER)

POST   /api/applications/{id}/legal/start            (LEGAL_OFFICER)
POST   /api/applications/{id}/legal/complete         (LEGAL_OFFICER)

POST   /api/applications/{id}/committee/start        (ADMIN: convene committee)
POST   /api/applications/{id}/committee/grant-aip    (LICENSING_COMMITTEE)
POST   /api/applications/{id}/committee/deny         (LICENSING_COMMITTEE)

GET    /api/applications/{id}/conditions             (all BNR roles + applicant read)
POST   /api/applications/{id}/conditions             (LICENSING_COMMITTEE: add at AIP)
PATCH  /api/applications/{id}/conditions/{cid}       (INSPECTION_OFFICER: mark fulfilled)

POST   /api/applications/{id}/inspection/schedule    (INSPECTION_OFFICER)
POST   /api/applications/{id}/inspection/submit-report (INSPECTION_OFFICER)

POST   /api/applications/{id}/license/confirm-fee    (ADMIN: fee payment confirmed)
POST   /api/applications/{id}/license/issue          (GOVERNOR_DELEGATE)

GET    /api/applications/{id}/documents
POST   /api/applications/{id}/documents              (APPLICANT, writable stages)
GET    /api/applications/{id}/documents/{did}/download
GET    /api/applications/{id}/documents/{did}/history

GET    /api/applications/{id}/audit
GET    /api/audit                                    (AUDITOR, ADMIN)
GET    /api/applications/{id}/sla                    (all BNR roles)

GET    /api/admin/users
POST   /api/admin/users
PATCH  /api/admin/users/{id}/deactivate

GET    /api/public/license-register                  (unauthenticated — public)
GET    /api/me
```

### Public license register

A publicly accessible endpoint returns all licensed institutions with their license number, license type, institution name, and date licensed. This mirrors the practice of all central banks, which are required to publish a register of licensed institutions for public verification.

```json
GET /api/public/license-register
[
  {
    "licenseNumber": "BNR/CB/2024/001",
    "institutionName": "Kigali Commercial Bank PLC",
    "licenseType": "COMMERCIAL_BANK",
    "licensedAt": "2024-03-15",
    "status": "ACTIVE"
  }
]
```

### Consistent error format

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition from TECHNICAL_REVIEW to LICENSED. Required path: TECHNICAL_REVIEW → LEGAL_REVIEW → COMMITTEE_DELIBERATION → APPROVAL_IN_PRINCIPLE → ORGANIZATION_PERIOD → PRE_LICENSE_INSPECTION → LICENSE_FEE_PENDING → LICENSED.",
    "details": {
      "currentStatus": "TECHNICAL_REVIEW",
      "attemptedStatus": "LICENSED",
      "applicationId": "..."
    },
    "timestamp": "2025-05-09T08:42:00Z"
  }
}
```

**HTTP status codes:**

| Situation | Code |
|---|---|
| Not authenticated | 401 |
| Forbidden (always — never 404 for auth) | 403 |
| Not found | 404 |
| Invalid state transition | 409 |
| Concurrent modification | 409 |
| AIP expired | 410 Gone |
| Validation error | 422 |
| File too large | 400 |

---

## 15. Frontend Design System

### NBR brand tokens (from official visual identity)

```css
:root {
  --bnr-brown:          #3D1C00;
  --bnr-brown-600:      #5C2D00;
  --bnr-brown-400:      #7A4A1E;
  --bnr-gold:           #C8921A;
  --bnr-gold-light:     #DBA832;
  --bnr-cream:          #F5E6C0;
  --bnr-cream-light:    #FAF3E0;

  --bnr-text-primary:   #1A0A00;
  --bnr-text-secondary: #6B4226;
  --bnr-text-on-dark:   #FFFFFF;

  /* Status palette */
  --status-draft:        #9CA3AF;
  --status-name-pending: #6366F1;
  --status-submitted:    #3B82F6;
  --status-completeness: #F59E0B;
  --status-review:       #EF4444; /* amber — under scrutiny */
  --status-aip:          #8B5CF6;
  --status-organization: #EC4899;
  --status-inspection:   #0EA5E9;
  --status-licensed:     #10B981;
  --status-rejected:     #EF4444;
  --status-expired:      #6B7280;
  --status-withdrawn:    #9CA3AF;

  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'Source Sans 3', 'Helvetica Neue', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

### Role-based layout guard (Next.js App Router)

```tsx
// app/(bnr)/layout.tsx
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

const BNR_ROLES = [
  'CASE_MANAGER', 'COMPLIANCE_OFFICER', 'TECHNICAL_REVIEWER',
  'FIT_AND_PROPER_OFFICER', 'LEGAL_OFFICER', 'INSPECTION_OFFICER',
  'LICENSING_COMMITTEE', 'GOVERNOR_DELEGATE', 'ADMIN', 'AUDITOR'
]

export default async function BnrLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session || !BNR_ROLES.includes(session.user.role)) {
    redirect('/login')
  }
  return <>{children}</>
}
```

Page HTML for BNR-only routes is never sent to an `APPLICANT`. The security check happens in the server, not in JavaScript.

### Application timeline component

The most important UI element for BNR staff is a vertical timeline showing every state the application has passed through, with timestamps, actors, and notes. This gives a regulator instant situational awareness without reading the full audit log.

```tsx
export function ApplicationTimeline({ auditEntries }: { auditEntries: AuditEntry[] }) {
  return (
    
      {auditEntries.map((entry) => (
        
          
          
            {formatDateTime(entry.createdAt)}
          
          {formatAction(entry.action)}
          {entry.actorName} · {entry.actorRole}
          {entry.description && (
            {entry.description}
          )}
        
      ))}
    
  )
}
```

### SLA clock widget

Every BNR application detail page shows the SLA status — remaining working days, whether the clock is paused (and why), and a visual indicator when approaching the 90-day limit.

```tsx
export function SlaWidget({ sla }: { sla: SlaStatus }) {
  const urgency = sla.remainingDays < 10 ? 'text-red-600' :
                  sla.remainingDays < 25 ? 'text-amber-600' : 'text-green-700'
  return (
    
      SLA Clock
      
        {sla.isPaused ? 'PAUSED' : `${sla.remainingDays} days`}
      
      {sla.isPaused && (
        {sla.pausedReason}
      )}
    
  )
}
```

### UI principles for a regulatory context

- **Clarity over decoration.** No animations that delay information display. Loading skeletons only where content takes >200ms.
- **Action availability is contextual.** A button for an action the current user cannot perform does not appear. The role-action map is derived from the backend `/api/me` response.
- **Status changes are irreversible in the UI.** Approve, reject, and license actions require a confirmation modal with an explicit typed confirmation for destructive states.
- **Error states are explicit.** Toast for transient errors. Full inline error panel for state transition failures with explanation of why it failed and what is needed next.
- **Empty states have context.** "No applications in your review queue" for a reviewer is different from "No applications submitted" for an applicant.

---

## 16. Testing Strategy

### State machine tests

```java
@Test void draft_to_name_approval_pending_is_valid()
@Test void name_approved_to_submitted_is_valid()
@Test void submitted_to_licensed_directly_is_rejected()         // no shortcuts
@Test void technical_review_to_aip_directly_is_rejected()       // must go through committee
@Test void organization_period_to_licensed_directly_is_rejected()// must inspect first
@Test void licensed_to_any_state_is_rejected()                  // terminal
@Test void rejected_to_any_state_is_rejected()                  // terminal
@Test void aip_expired_to_any_state_is_rejected()               // terminal
@Test void withdrawn_to_any_state_is_rejected()                 // terminal
@Test void additional_info_returns_to_originating_state()
@Test void all_transition_map_entries_have_test_coverage()
```

### Authorization tests

```java
@Test void applicant_cannot_complete_technical_review()
@Test void technical_reviewer_cannot_issue_license()
@Test void reviewer_who_reviewed_cannot_issue_license()        // separation of duties
@Test void compliance_officer_who_checked_cannot_issue_license()
@Test void governor_delegate_on_application_they_reviewed_returns_403()
@Test void auditor_gets_403_on_any_write_endpoint()
@Test void applicant_cannot_see_another_applicants_application()
@Test void unauthenticated_request_returns_401_not_500()
@Test void forbidden_request_returns_403_not_404()
@Test void public_license_register_is_accessible_without_auth()
```

### Concurrency test

```java
@Test void concurrent_state_transition_exactly_one_succeeds()
@Test void concurrent_document_upload_does_not_duplicate_current_flag()
@Test void concurrent_fit_and_proper_completion_exactly_one_succeeds()
```

### Audit trail tests

```java
@Test void every_state_change_creates_audit_entry()
@Test void audit_entry_captures_previous_and_new_state()
@Test void audit_entry_update_throws_exception()
@Test void audit_entry_delete_throws_exception()
@Test void document_upload_creates_audit_entry()
@Test void fit_and_proper_completion_creates_audit_entry()
@Test void audit_action_is_enum_not_freetext()
```

### SLA clock tests

```java
@Test void clock_starts_when_case_assigned()
@Test void clock_pauses_when_additional_info_requested()
@Test void clock_resumes_when_info_provided()
@Test void paused_clock_does_not_accumulate_days()
@Test void expired_aip_is_auto_transitioned_by_scheduler()
@Test void sla_remaining_days_calculates_correctly_with_weekends_excluded()
```

### What to document if time runs out

- Integration tests for the full SUBMITTED → LICENSED workflow via HTTP calls
- Multipart upload edge cases: zero-byte file, exactly-5MB file, file just over 5MB
- Fit-and-proper: any single NOT_FIT outcome blocks the application
- AIP expiry boundary: application at exactly 365 days, 366 days
- Capital minimum check: proposed capital exactly at minimum, one RWF below minimum
- Foreign bank branch: missing home supervisor fields should block submission

---

## 17. Seed Data

```sql
-- V9__seed_data.sql

INSERT INTO users (id, email, password_hash, role, full_name, organisation) VALUES
  ('u-0001', 'applicant@kcb.rw',          '$2b$12$...hashed...', 'APPLICANT',              'Jean Pierre Habimana',   'KCB Rwanda Promoters'),
  ('u-0002', 'compliance@bnr.rw',          '$2b$12$...hashed...', 'COMPLIANCE_OFFICER',     'Marie Claire Uwase',     'BNR Licensing Dept'),
  ('u-0003', 'reviewer@bnr.rw',            '$2b$12$...hashed...', 'TECHNICAL_REVIEWER',     'Patrick Ndayisenga',     'BNR Licensing Dept'),
  ('u-0004', 'fp.officer@bnr.rw',          '$2b$12$...hashed...', 'FIT_AND_PROPER_OFFICER', 'Claudine Mukamana',      'BNR Licensing Dept'),
  ('u-0005', 'legal@bnr.rw',              '$2b$12$...hashed...', 'LEGAL_OFFICER',          'Emmanuel Nshimiyimana',  'BNR Legal Division'),
  ('u-0006', 'inspector@bnr.rw',           '$2b$12$...hashed...', 'INSPECTION_OFFICER',     'Solange Ingabire',       'BNR Examination Dept'),
  ('u-0007', 'committee@bnr.rw',           '$2b$12$...hashed...', 'LICENSING_COMMITTEE',    'Dr. Diane Kamanzi',      'BNR Board Committee'),
  ('u-0008', 'governor.delegate@bnr.rw',   '$2b$12$...hashed...', 'GOVERNOR_DELEGATE',      'Prof. John Rwangombwa',  'BNR Executive'),
  ('u-0009', 'admin@bnr.rw',              '$2b$12$...hashed...', 'ADMIN',                  'Eric Mugisha',           'BNR IT Dept'),
  ('u-0010', 'auditor@bnr.rw',             '$2b$12$...hashed...', 'AUDITOR',                'Jeannette Nzeyimana',    'BNR Internal Audit');

-- All passwords: Test@1234 (bcrypt hashed at cost 12)
```

**App 1 — Active technical review** (`TECHNICAL_REVIEW`):
Commercial bank application with all required documents, F&P passed, assigned reviewer `u-0003`, SLA clock running at day 32 of 90.

**App 2 — Approved and licensed** (`LICENSED`):
Forex bureau application, full workflow completed, license number `BNR/FB/2024/001`, all audit entries populated, two AIP conditions both marked fulfilled, inspection report showing all checks passed.

**App 3 — Organization period** (`ORGANIZATION_PERIOD`):
Microfinance Tier 1 application, AIP granted 6 months ago, expires in 6 months, three AIP conditions (one fulfilled, two outstanding), capital deposit proof uploaded.

Seeds also populate the audit log for all three applications so evaluators can immediately see a populated timeline.

---

## 18. Hard Decisions & Trade-offs

### AIP vs single approval

**Decision:** Two-stage approval: `APPROVAL_IN_PRINCIPLE` followed by `LICENSED`.

**Rationale:** Every central bank globally uses this two-stage approach. A single `APPROVED` state would model a process that does not exist. The AIP stage allows BNR to grant conditional approval while the applicant organizes the institution, without allowing the institution to begin operations.

**Trade-off:** More complexity in the state machine, more tables, more UI states. Accepted — this is the domain requirement, not an over-engineering decision.

**Given more time:** Model the formal committee voting record — each `LICENSING_COMMITTEE` member's vote (approve/deny/abstain), quorum requirements, meeting minutes reference.

### SLA clock implementation

**Decision:** Working-days counter stored in the database, updated on each transition.

**Rationale:** The SLA commitment is a regulatory obligation. Tracking it in the database makes it queryable, auditable, and reportable. A management dashboard can show all applications approaching their 90-day limit.

**Trade-off:** Working day calculation must handle public holidays in Rwanda. Implemented with a `RwandaPublicHolidays` utility class. If this system is extended to other jurisdictions, holiday calendars become a configuration concern.

**Given more time:** Automated escalation emails when SLA reaches 80% and 95% consumed.

### Fit-and-proper as first-class data

**Decision:** Separate `fit_and_proper_assessments` table with one row per individual, rather than a checklist on the application.

**Rationale:** A commercial bank application may have 15+ individuals to assess. Collapsing this into a JSONB field on the application table makes it impossible to query which applications have outstanding F&P assessments for a specific individual. The relational model is the right choice here.

**Trade-off:** More joins, more service complexity. Accepted — correctness over simplicity.

### State machine: enum + transition map vs workflow engine

**Decision:** Pure Java enum-based state machine with a transition map in `StateMachineService`.

**Rationale:** The licensing workflow is a known, small, infrequently-changing graph. A workflow engine (Temporal, Activiti, Flowable) adds significant operational overhead for a v1 system. The service layer implementation is clean, fully testable, and readable.

**Trade-off:** Adding a state requires a migration and code change. Acceptable — BNR licensing regulations change slowly through formal regulatory processes.

**Given more time:** If BNR needed parallel review tracks (e.g., F&P assessment running concurrently with technical review), or the process differed significantly by license type, a proper workflow engine would be warranted.

### Ambiguous requirements — explicit decisions

**Who can withdraw an application post-AIP?** The requirements allow withdrawal before final decision. Chosen: withdrawal is only available before `APPROVAL_IN_PRINCIPLE`. Post-AIP, the applicant has committed to the organization period, and BNR has committed regulatory resources. If the applicant abandons, the AIP expires naturally. This prevents applicants from gaming the system by withdrawing and reapplying to get a fresh SLA clock.

**Can a rejected application be reapplied?** `REJECTED` is terminal for that application instance. The applicant must start a new application with a new reference number. The old application remains fully visible in the audit trail. This preserves the integrity of each application's history.

**What happens when all F&P assessments are complete?** The system automatically transitions to `TECHNICAL_REVIEW` when the last outstanding `FitAndProperAssessment` is marked `FIT`. If any individual is marked `NOT_FIT`, the application enters `ADDITIONAL_INFO_REQUESTED`. The applicant must either replace the individual or provide remediation evidence. A replaced individual requires a new `FitAndProperAssessment` record.

---

## 19. Out of Scope — Documented

These features are deliberately excluded from this submission. They are documented here because omitting them without acknowledging them would indicate insufficient domain understanding.

**License renewal.** Banking licenses typically require annual renewal — the institution reconfirms compliance, pays a renewal fee, and BNR confirms there are no outstanding supervisory concerns. This would be a new state branch starting from `LICENSED` and would require a `LicenseRenewal` entity separate from `Application`.

**License revocation.** A separate enforcement workflow — distinct from the licensing workflow — for when BNR initiates proceedings to revoke an existing license due to regulatory violations. This is a fundamentally different process (driven by BNR, not the applicant) and warrants its own state machine.

**Post-licensing supervision.** After licensing, BNR conducts periodic on-site examinations and receives regular statutory returns (quarterly, annually). This is ongoing supervision, not licensing. It would require a `SupervisoryExamination` entity and a reporting module.

**AIP revocation during organization period.** If major adverse developments occur during the organization period (key shareholders found involved in money laundering, capital found to be fraudulent), BNR can revoke the AIP. This requires a committee decision mid-process.

**Public comment period.** Some jurisdictions allow public objections to bank license applications. This would require a public-facing submission form and a process for BNR to consider and respond to objections.

**Fee collection integration.** Application fees and licensing fees are currently confirmed by an admin action. Production would integrate with BNR's payment processing system or Rwanda's e-government payment platform (Irembo Pay).

**Notification system.** Production would send email and/or in-portal notifications at every state transition, every information request, and every approaching deadline. The audit log already captures the data needed to drive this — the integration point is a `NotificationService` that reads the audit stream.

**File virus scanning.** Before any uploaded file touches the filesystem, production would pass it through ClamAV or an equivalent service. The current implementation accepts files as-is after MIME type and size validation.

---

## 20. README Checklist

Your README must answer these in order with copy-pasteable commands:

1. What is this? (one paragraph)
2. Tech stack (bullets: Java 21, Spring Boot 3.3, Next.js 14, PostgreSQL 16, Maven, pnpm)
3. Prerequisites with version requirements
4. Environment variables (`.env.example` for both backend and frontend)
5. Database setup: `createdb bnr_licensing`
6. Run Flyway migrations (seeds data): `./mvnw flyway:migrate`
7. Start backend: `./mvnw spring-boot:run` (port 8080)
8. Start frontend: `pnpm dev` (port 3000)
9. Default login credentials (all 10 seeded users + password: `Test@1234`)
10. Run all tests: `./mvnw test`
11. API docs: `http://localhost:8080/swagger-ui.html`
12. Public license register: `http://localhost:3000/register`
13. Design document: this file
14. What was prioritized vs left out, and why
15. Known limitations

> The single most important line in the README: if the evaluator cannot run it in under 10 minutes, the evaluation stops.