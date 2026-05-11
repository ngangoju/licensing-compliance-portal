# Bank Licensing & Compliance Portal — BNR

> A full-stack regulatory portal for the National Bank of Rwanda, replacing the manual bank licensing process end-to-end. Built as a Senior Software Engineer assessment submission.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Seed Credentials](#seed-credentials)
- [Application Lifecycle Walkthrough](#application-lifecycle-walkthrough)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Design Document](#design-document)
- [Project Structure](#project-structure)
- [What Was Deliberately Left Out](#what-was-deliberately-left-out)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Java | 21+ | Required for Spring Boot 3.3 |
| Maven | 3.9+ | Bundled via `./mvnw` wrapper — no install needed |
| Node.js | 18+ | For the Next.js frontend |
| pnpm | 8+ | `npm install -g pnpm` |
| PostgreSQL | 15+ | See setup below |
| Docker | Optional | For Testcontainers-based tests |

---

## Architecture

```
┌──────────────────────────────────────┐
│   Next.js 14 (port 3000)             │
│   App Router · TypeScript · Tailwind │
└─────────────────┬────────────────────┘
                  │ HTTP/JSON
┌─────────────────▼────────────────────┐
│   Spring Boot 3.3 (port 8080)        │
│   JWT Auth · Spring Security RBAC    │
│   Flyway Migrations · Hibernate 6    │
└────────┬─────────────────────────────┘
         │
┌────────▼──────────┐  ┌───────────────┐
│  PostgreSQL 15    │  │  Local FS     │
│  schema: bnr      │  │  storage/     │
│  schema: audit    │  │  (documents)  │
└───────────────────┘  └───────────────┘
```

**Key design decisions:**

- **Two-schema PostgreSQL** — `bnr` for application data, `audit` for the append-only audit log. The application DB user has no `UPDATE`/`DELETE` rights on `audit.*`, enforced at the PostgreSQL permission level via a `SECURITY DEFINER` function.
- **JWT stateless auth** — 15-minute access tokens + 7-day refresh tokens. Stateless = horizontally scalable.
- **Optimistic locking** — `@Version` on the `Application` entity prevents concurrent state corruption; conflicting writes return `409 Conflict`.
- **Separation of duties** — the user who reviewed an application (Technical Reviewer, Compliance Officer, Legal Officer) cannot issue the final license. Enforced at the service layer and via a database `CHECK` constraint.
- **SLA clock** — tracks working days consumed per application. Pauses automatically when additional information is requested; resumes when the applicant responds.

---

## Quick Start

### 1. PostgreSQL Setup

```bash
psql -U postgres

CREATE ROLE bnr_app WITH LOGIN PASSWORD 'password';
CREATE DATABASE bnr_licensing OWNER bnr_app;
ALTER ROLE bnr_app CREATEDB;

\c bnr_licensing
GRANT CREATE ON DATABASE bnr_licensing TO bnr_app;
\q
```

Flyway creates the `bnr` and `audit` schemas and runs all migrations (`V1`–`V10`) on first startup. No manual SQL is needed.

### 2. Backend

```bash
cd licensing-compliance-portal-backend
./mvnw spring-boot:run
```

The backend starts on **http://localhost:8080**. The `DatabaseSeeder` seeds all users and sample applications automatically on first run (when the `users` table is empty).

**Optional environment variable overrides:**

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | Base64 key in `application.yml` | Override for production |
| `DOCUMENT_STORAGE_PATH` | `storage` | Path for uploaded document files |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/bnr_licensing` | DB URL |
| `SPRING_DATASOURCE_USERNAME` | `bnr_app` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `password` | DB password |

### 3. Frontend

```bash
cd licensing-compliance-portal-ui
pnpm install
pnpm dev
```

The frontend starts on **http://localhost:3000**.

---

## Seed Credentials

All seed accounts share the password: **`Test@1234`**

| Name | Email | Role | Department |
|------|-------|------|------------|
| Jean Pierre Habimana | `applicant@kcb.rw` | `APPLICANT` | KCB Rwanda Promoters |
| Marie Claire Uwase | `compliance@bnr.rw` | `COMPLIANCE_OFFICER` | BNR Licensing Dept |
| Patrick Ndayisenga | `reviewer@bnr.rw` | `TECHNICAL_REVIEWER` | BNR Licensing Dept |
| Claudine Mukamana | `fp.officer@bnr.rw` | `FIT_AND_PROPER_OFFICER` | BNR Licensing Dept |
| Emmanuel Nshimiyimana | `legal@bnr.rw` | `LEGAL_OFFICER` | BNR Legal Division |
| Solange Ingabire | `inspector@bnr.rw` | `INSPECTION_OFFICER` | BNR Examination Dept |
| Dr. Jennifer Batamuliza | `committee@bnr.rw` | `LICENSING_COMMITTEE` | BNR Board Committee |
| Soraya M. Hakuziyaremye | `governor.delegate@bnr.rw` | `GOVERNOR_DELEGATE` | BNR Executive |
| Eric Mugisha | `admin@bnr.rw` | `ADMIN` | BNR IT Dept |
| Jeannette Nzeyimana | `auditor@bnr.rw` | `AUDITOR` | BNR Internal Audit |

**Seeded applications:**

| Reference | Status | Type | Institution |
|-----------|--------|------|-------------|
| `BNR-2025-0001` | `TECHNICAL_REVIEW` | Commercial Bank | Kigali Commercial Bank PLC |
| `BNR-2024-0017` | `LICENSED` | Forex Bureau | Kigali Forex Bureau Ltd |
| `BNR-2025-0009` | `ORGANIZATION_PERIOD` | Microfinance (Tier 1) | Umurage Microfinance Ltd |

The seeded applications are in different workflow stages so evaluators can immediately test each role's queue and action panels without manually stepping through the full process.

---

## Application Lifecycle Walkthrough

This section traces a complete licensing application from first contact to final licence issuance, identifying exactly who acts at each stage and what the system does in response. Use the credentials above to log in as each actor and follow the journey.

### Stage 1 — Name Reservation

The applicant proposes an institution name. BNR verifies it does not conflict with an existing licensed institution and does not imply a function the institution is not licensed for.

| Actor | Email | Action | Status transition |
|-------|-------|--------|-------------------|
| **Jean Pierre Habimana** | `applicant@kcb.rw` | Creates a draft application, enters proposed name and licence type, requests name approval. | `DRAFT` → `NAME_APPROVAL_PENDING` |
| **Marie Claire Uwase** | `compliance@bnr.rw` | Reviews the proposed name. Approves or rejects with a written reason. | `NAME_APPROVAL_PENDING` → `NAME_APPROVED` (or back to `DRAFT`) |

### Stage 2 — Formal Submission & Completeness Check

Once the name is approved, the applicant completes the full application form, uploads all required documents, and formally submits. BNR verifies the submission is complete before allocating review resources.

| Actor | Email | Action | Status transition |
|-------|-------|--------|-------------------|
| **Jean Pierre Habimana** | `applicant@kcb.rw` | Uploads Business Plan, Articles of Incorporation, AML/CFT Policy, and all other licence-type-specific documents. Submits formally. | `NAME_APPROVED` → `SUBMITTED` |
| **Marie Claire Uwase** | `compliance@bnr.rw` | Runs completeness check — verifies all required documents are present and proposed capital meets the statutory minimum. If incomplete, requests additional documents (SLA clock pauses). On pass: assigns a case manager. | `SUBMITTED` → `CASE_ASSIGNED` (or `INCOMPLETE`) |

> **SLA clock starts** at `CASE_ASSIGNED`. The target is 90 working days to AIP decision. The clock pauses during any `ADDITIONAL_INFO_REQUESTED` period and resumes when the applicant responds.

### Stage 3 — Parallel Technical Reviews

Three independent assessments run in sequence. Each reviewer has access to the full application and uploaded documents.

| Actor | Email | Responsibility | Status |
|-------|-------|---------------|--------|
| **Claudine Mukamana** | `fp.officer@bnr.rw` | Fit-and-proper assessment for every proposed director and significant shareholder (≥5%). Reviews criminal records, financial history, qualifications, and conflicts of interest. Conducts in-person interviews for executive roles. | `FIT_AND_PROPER_ASSESSMENT` |
| **Patrick Ndayisenga** | `reviewer@bnr.rw` | Technical review — business plan viability, capital adequacy, risk management framework, AML/CFT compliance, IT systems, and governance structures against BNR Corporate Governance Guidelines 2019. | `TECHNICAL_REVIEW` |
| **Emmanuel Nshimiyimana** | `legal@bnr.rw` | Legal review — Articles of Incorporation against Rwanda Company Law, shareholder agreements for provisions conflicting with BNR supervisory authority, proposed bylaws, and (for foreign banks) branch structure validity under both Rwandan and home-country law. | `LEGAL_REVIEW` |

Any reviewer may request additional information from the applicant. This pauses the SLA clock and creates an `ADDITIONAL_INFO_REQUESTED` event in the audit trail with a written reason visible to the applicant.

### Stage 4 — Committee Deliberation & AIP

The Licensing Committee receives a complete decision bundle — technical review findings, F&P outcomes, and legal review — and votes on whether to grant Approval-in-Principle (AIP).

| Actor | Email | Action | Status transition |
|-------|-------|--------|-------------------|
| **Dr. Jennifer Batamuliza** | `committee@bnr.rw` | Reviews the full assessment bundle. Adds specific conditions the applicant must fulfil before the final licence is issued. | `COMMITTEE_DELIBERATION` |
| **Dr. Jennifer Batamuliza** | `committee@bnr.rw` | Grants AIP with conditions, or denies with a written reason. | → `APPROVAL_IN_PRINCIPLE` or `REJECTED` |

> **AIP is not a licence to operate.** It is permission to organise the institution. The applicant has **12 months** from AIP to complete all conditions. If the deadline is missed, the application automatically transitions to `AIP_EXPIRED` (enforced by a nightly scheduled job).

### Stage 5 — Organisation Period & Pre-Opening Inspection

The applicant sets up the physical bank — premises, IT systems, staff, capital injection — and fulfils each condition attached to the AIP. When ready, they request a pre-opening inspection.

| Actor | Email | Action | Status transition |
|-------|-------|--------|-------------------|
| **Jean Pierre Habimana** | `applicant@kcb.rw` | Injects required capital into BNR's suspense account, establishes premises, implements core banking systems, hires and trains staff, finalises all policy manuals, uploads evidence for each condition. | `ORGANIZATION_PERIOD` |
| **Solange Ingabire** | `inspector@bnr.rw` | Conducts an on-site inspection. Verifies capital deposit, physical premises, IT systems demonstration, AML monitoring, key staff credentials, and policy manuals. Marks each AIP condition as fulfilled or outstanding. | `PRE_LICENSE_INSPECTION` |
| **Solange Ingabire** | `inspector@bnr.rw` | Submits inspection report. Pass → fee pending. Fail → returns to `ORGANIZATION_PERIOD` for remediation. | → `LICENSE_FEE_PENDING` or `INSPECTION_FAILED` |

### Stage 6 — Fee Payment & Final Licence

The applicant pays the licensing fee. Once confirmed, the Governor's Delegate performs the final executive sign-off and generates the licence number.

| Actor | Email | Action | Status transition |
|-------|-------|--------|-------------------|
| **Marie Claire Uwase** | `compliance@bnr.rw` | Confirms receipt of the licensing fee payment. | `LICENSE_FEE_PENDING` (fee confirmed) |
| **Soraya M. Hakuziyaremye** | `governor.delegate@bnr.rw` | Reviews the complete file — all AIP conditions fulfilled, inspection passed, separation-of-duties verified. Issues the final operating licence. Generates licence number (`BNR/CB/2025/001`). Institution appears in the public licence register. | → `LICENSED` 🎉 |

### Oversight & Support Roles

These roles operate across the entire lifecycle without owning a specific stage.

| Actor | Email | Role | Access |
|-------|-------|------|--------|
| **Jeannette Nzeyimana** | `auditor@bnr.rw` | `AUDITOR` | Read-only access to all applications and the immutable audit log. Can view every state change, document upload, and reviewer action across the system. No write permissions. |
| **Eric Mugisha** | `admin@bnr.rw` | `ADMIN` | User management (create, deactivate), reviewer reassignment when a staff member is unavailable, SLA monitoring across all applications. Cannot override decisions or modify audit records. |

---

## Running Tests

Tests run against an **in-memory H2 database**. No PostgreSQL or Docker is required to run the test suite.

```bash
cd licensing-compliance-portal-backend

./mvnw test

# Run a specific class
./mvnw test -Dtest=StateMachineTest
./mvnw test -Dtest=AuthorizationTest
./mvnw test -Dtest=ConcurrencyTest
./mvnw test -Dtest=SlaClockTest
```

| Test Class | What it covers |
|------------|---------------|
| `StateMachineTest` | All 14 valid transitions, all invalid shortcuts, terminal-state immutability |
| `AuthorizationTest` | Every role's permitted and forbidden endpoints; 403 on cross-role calls |
| `ConcurrencyTest` | Two threads acting simultaneously on the same application — one wins, one gets 409 |
| `SlaClockTest` | Clock start / pause / resume / remaining-days calculation across multiple info-request cycles |
| `AuthControllerIntegrationTest` | Login returns token pair; bad credentials return 401 |
| `SecurityIntegrationTest` | Protected endpoints without token → 401; wrong role → 403 |
| `DocumentIntegrationTest` | Upload creates metadata + audit entry; files >5 MB are rejected |
| `PublicRegisterIntegrationTest` | Licence register accessible without authentication |

---

## API Documentation

With the backend running:

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs

### Key Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | Public | Returns `accessToken` + `refreshToken` |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for new access token |
| `GET` | `/api/me` | Any authenticated | Current user profile and role |
| `GET` | `/api/public/license-register` | Public | All licensed institutions |
| `POST` | `/api/applications/draft` | APPLICANT | Create draft application |
| `GET` | `/api/applications/my` | APPLICANT | Own applications |
| `GET` | `/api/applications/queue` | BNR staff | Role-filtered work queue |
| `GET` | `/api/applications/{id}` | Any authenticated | Application detail |
| `POST` | `/api/applications/{id}/submit-name-approval` | APPLICANT | Request name approval |
| `POST` | `/api/applications/{id}/approve-name` | COMPLIANCE_OFFICER | Approve institution name |
| `POST` | `/api/applications/{id}/reject-name` | COMPLIANCE_OFFICER | Reject name with reason |
| `POST` | `/api/applications/{id}/submit` | APPLICANT | Formal submission |
| `POST` | `/api/applications/{id}/start-completeness-check` | COMPLIANCE_OFFICER | Begin completeness review |
| `POST` | `/api/applications/{id}/assign-case-manager` | COMPLIANCE_OFFICER | Assign case manager |
| `POST` | `/api/applications/{id}/start-fit-and-proper` | CASE_MANAGER | Start F&P assessment stage |
| `POST` | `/api/applications/{id}/start-technical-review` | TECHNICAL_REVIEWER | Begin technical review |
| `POST` | `/api/applications/{id}/complete-technical-review` | TECHNICAL_REVIEWER | Complete technical review |
| `POST` | `/api/applications/{id}/start-legal-review` | LEGAL_OFFICER | Begin legal review |
| `POST` | `/api/applications/{id}/complete-legal-review` | LEGAL_OFFICER | Complete legal review |
| `POST` | `/api/applications/{id}/review/request-info` | TECHNICAL_REVIEWER, LEGAL_OFFICER, FIT_AND_PROPER_OFFICER | Request additional information (pauses SLA) |
| `POST` | `/api/applications/{id}/additional-info/respond` | APPLICANT | Submit response (resumes SLA) |
| `POST` | `/api/applications/{id}/grant-approval-in-principle` | LICENSING_COMMITTEE | Grant AIP with conditions |
| `POST` | `/api/applications/{id}/deny-approval-in-principle` | LICENSING_COMMITTEE | Deny AIP with reason |
| `POST` | `/api/applications/{id}/request-inspection` | INSPECTION_OFFICER | Schedule pre-licence inspection |
| `POST` | `/api/applications/{id}/submit-inspection-report` | INSPECTION_OFFICER | Submit inspection results |
| `POST` | `/api/applications/{id}/confirm-fee-payment` | COMPLIANCE_OFFICER, ADMIN | Confirm licence fee received |
| `POST` | `/api/applications/{id}/issue-license` | GOVERNOR_DELEGATE | Issue final operating licence |
| `POST` | `/api/applications/{id}/documents` | APPLICANT | Upload document (max 5 MB) |
| `GET` | `/api/applications/{id}/documents` | Any authenticated | List application documents |
| `GET` | `/api/applications/{id}/documents/{docId}` | Any authenticated | Download document |
| `GET` | `/api/applications/{id}/audit` | Any authenticated | Application audit timeline |
| `GET` | `/api/audit/global` | ADMIN, AUDITOR | Global audit log (paginated) |
| `GET` | `/api/admin/users` | ADMIN | List all users |
| `PATCH` | `/api/admin/users/{id}/deactivate` | ADMIN | Deactivate a user |

Unauthorized requests return `403 Forbidden`. Unauthenticated requests return `401 Unauthorized`. Neither returns `404` or `500` for access control failures.

---

## Design Document

See [`DESIGN.md`](./DESIGN.md) for:

- Full system architecture and rationale
- Complete state machine (20 states, all valid transitions, terminal-state rules)
- Role permission matrix (11 roles × all actions)
- Audit trail tamper-proof design (PostgreSQL `SECURITY DEFINER` function)
- Concurrency control approach (optimistic locking with `@Version`)
- SLA clock design (working-day calculation, pause/resume, Rwanda public holidays)
- Hard decisions and documented trade-offs

---

## Project Structure

```
.
├── README.md                                    ← You are here
├── DESIGN.md                                    ← Full design document
├── licensing-compliance-portal-backend/
│   ├── src/main/java/rw/bnr/licensing/
│   │   ├── config/                              ← Security, JWT filter, CORS, database seeder
│   │   ├── controller/                          ← REST controllers
│   │   ├── domain/
│   │   │   ├── entity/                          ← JPA entities (Application, User, AuditEntry, …)
│   │   │   └── enums/                           ← ApplicationStatus, UserRole, AuditAction, …
│   │   ├── repository/                          ← Spring Data repositories
│   │   ├── service/                             ← Business logic (StateMachineService, SlaClockService, …)
│   │   ├── dto/                                 ← Request/response DTOs
│   │   ├── exception/                           ← GlobalExceptionHandler, typed exceptions
│   │   ├── security/                            ← JWT filter, UserDetailsService
│   │   └── scheduled/                           ← AIP expiry job (nightly)
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-test.yml
│   │   └── db/migration/                        ← Flyway SQL (V1–V10)
│   └── src/test/java/rw/bnr/licensing/
│       ├── StateMachineTest.java
│       ├── AuthorizationTest.java
│       ├── ConcurrencyTest.java
│       ├── SlaClockTest.java
│       ├── AuthControllerIntegrationTest.java
│       ├── DocumentIntegrationTest.java
│       ├── SecurityIntegrationTest.java
│       └── PublicRegisterIntegrationTest.java
└── licensing-compliance-portal-ui/
    ├── app/
    │   ├── (auth)/                              ← Login, registration
    │   ├── (public)/                            ← Public licence register (no auth required)
    │   ├── (applicant)/                         ← Applicant workspace (server-side role guard)
    │   └── (bnr)/                               ← BNR staff portal (server-side role guard)
    ├── components/                              ← Shared UI components
    │   ├── ui/                                  ← Design system primitives
    │   ├── dashboards/                          ← Role-specific dashboard components
    │   └── application/                         ← Application detail, timeline, document zones
    ├── lib/
    │   ├── api.ts                               ← Typed fetch wrapper with auth
    │   └── constants.ts                         ← Status labels, RBAC maps, required documents
    └── types/index.ts                           ← Shared TypeScript interfaces

```

---

## What Was Deliberately Left Out

The following are acknowledged design gaps, intentionally excluded to stay within scope. Each would be the next feature in a production roadmap.

| Feature | Reason excluded |
|---------|----------------|
| Email / SMS notifications | No transactional email service configured. The audit log provides the data model to drive notifications — a `NotificationService` reading the audit stream is the integration point. |
| Multi-factor authentication | Out of scope for this assessment. The architecture (stateless JWT) supports adding TOTP as a second factor without structural changes. |
| File encryption at rest | Documents are stored on the local filesystem with UUID filenames. Production would encrypt at rest using AES-256 before the filesystem write. |
| Appeal process for rejected applications | Post-rejection appeals are a separate regulatory workflow, not part of the initial licensing process modelled here. |
| Second failed inspection escalation | A second failed inspection would escalate to the committee for AIP review or revocation. Implemented as a manual admin action for now. |
| Audit log export to PDF / SIEM | The `GET /api/audit/global` endpoint returns JSON. CSV export is available. PDF generation and SIEM integration (Splunk, ELK) are production concerns. |
| Real-time notifications (WebSocket) | No WebSocket layer. Staff must reload their queue to see new applications. |
| Rwanda government identity verification | Applicant identity is self-declared. Production integration with Rwanda's national ID system (Irembo) would verify identity at registration. |