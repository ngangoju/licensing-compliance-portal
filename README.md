# Bank Licensing & Compliance Portal — BNR

> A full-stack regulatory portal for the National Bank of Rwanda, replacing the manual bank licensing process end-to-end. Built as a Senior Software Engineer assessment submission.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Seed Credentials](#seed-credentials)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [Design Document](#design-document)
- [Project Structure](#project-structure)

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
- **Two-schema PostgreSQL** — `bnr` for application data, `audit` for the append-only audit log. The application DB user has no `UPDATE`/`DELETE` rights on `audit.*`.
- **JWT stateless auth** — 15-minute access tokens + 7-day refresh tokens. Stateless = horizontally scalable.
- **Optimistic locking** — `@Version` on `Application` entity prevents concurrent state corruption; returns `409 Conflict`.
- **Separation of duties** — the user who reviewed an application (Technical Reviewer, Compliance Officer, Legal Officer) cannot issue the final license. Enforced at service layer + DB constraint.

---

## Quick Start

### 1. PostgreSQL Setup

```bash
# Connect as postgres superuser
psql -U postgres

# Create the application role
CREATE ROLE bnr_app WITH LOGIN PASSWORD 'password';

# Create the database
CREATE DATABASE bnr_licensing OWNER bnr_app;

# Grant schema creation rights (Flyway needs this)
ALTER ROLE bnr_app CREATEDB;

# Connect to the new database and allow schema creation
\c bnr_licensing
GRANT CREATE ON DATABASE bnr_licensing TO bnr_app;

\q
```

> **Note:** Flyway will automatically create the `bnr` and `audit` schemas and run all migrations (`V1` through `V10`) on first startup. No manual SQL needed.

### 2. Backend

```bash
cd licensing-compliance-portal-backend

# Run with dev profile (connects to PostgreSQL)
./mvnw spring-boot:run

# Or with explicit profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The backend starts on **http://localhost:8080**.

Flyway migrations run automatically. The `DatabaseSeeder` seeds all users on first run (when `users` table is empty).

**Environment variables (optional overrides):**

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | base64 key in `application.yml` | Override for production |
| `DOCUMENT_STORAGE_PATH` | `storage` | Path for uploaded document files |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/bnr_licensing` | DB URL |
| `SPRING_DATASOURCE_USERNAME` | `bnr_app` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `password` | DB password |

### 3. Frontend

```bash
cd licensing-compliance-portal-ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The frontend starts on **http://localhost:3000**.

---

## Seed Credentials

All seed users share the same password: **`Test@1234`**

| Email | Role | Description |
|-------|------|-------------|
| `applicant@kcb.rw` | `APPLICANT` | KCB Rwanda promoter — submits applications |
| `compliance@bnr.rw` | `COMPLIANCE_OFFICER` | Completeness checks, name approvals |
| `casemanager@bnr.rw` | `CASE_MANAGER` | Application coordinator |
| `reviewer@bnr.rw` | `TECHNICAL_REVIEWER` | Business plan & capital review |
| `fp.officer@bnr.rw` | `FIT_AND_PROPER_OFFICER` | Director due diligence |
| `legal@bnr.rw` | `LEGAL_OFFICER` | Charter and bylaws review |
| `inspector@bnr.rw` | `INSPECTION_OFFICER` | Pre-opening on-site inspection |
| `committee@bnr.rw` | `LICENSING_COMMITTEE` | AIP decision (Approval in Principle) |
| `governor.delegate@bnr.rw` | `GOVERNOR_DELEGATE` | Issues final license |
| `admin@bnr.rw` | `ADMIN` | User management |
| `auditor@bnr.rw` | `AUDITOR` | Read-only audit access |

**Seeded applications (PostgreSQL / V9 migration):**

| Reference | Status | Institution |
|-----------|--------|-------------|
| `BNR-2025-0001` | `TECHNICAL_REVIEW` | Kigali Commercial Bank PLC |
| `BNR-2024-0017` | `LICENSED` | Kigali Forex Bureau Ltd |
| `BNR-2025-0009` | `ORGANIZATION_PERIOD` | Umurage Microfinance Ltd |

---

## Running Tests

### Backend Tests

Tests run against an **in-memory H2 database** (no PostgreSQL or Docker required for the test suite).

```bash
cd licensing-compliance-portal-backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=StateMachineTest
./mvnw test -Dtest=AuthorizationTest
./mvnw test -Dtest=ConcurrencyTest
./mvnw test -Dtest=DocumentIntegrationTest
```

**Test coverage:**

| Test Class | What it covers |
|------------|---------------|
| `StateMachineTest` | All valid transitions, invalid transitions, terminal-state immutability, edge cases |
| `AuthorizationTest` | Every role's permitted and forbidden endpoints (403 enforcement) |
| `ConcurrencyTest` | Two threads acting on the same application simultaneously — one wins, one gets 409 |
| `SlaClockTest` | SLA clock start / pause / resume / remaining days calculation |
| `AuthControllerIntegrationTest` | Login returns tokens; unauthenticated returns 401 |
| `SecurityIntegrationTest` | Bad credentials → 401; protected endpoint without token → 401 |
| `DocumentIntegrationTest` | Upload creates metadata + audit entry; >5MB rejected |
| `PublicRegisterIntegrationTest` | License register accessible without authentication |

### Frontend Tests

```bash
cd licensing-compliance-portal-ui
pnpm test
```

---

## API Documentation

With the backend running, visit:

- **Swagger UI:** http://localhost:8080/swagger-ui.html
- **OpenAPI JSON:** http://localhost:8080/v3/api-docs

### Key Endpoints

| Method | Path | Role | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | Public | Returns `accessToken` + `refreshToken` |
| `POST` | `/api/auth/refresh` | Public | Exchange refresh token for new access token |
| `GET` | `/api/me` | Any | Current user profile |
| `POST` | `/api/applications/draft` | APPLICANT | Create draft application |
| `GET` | `/api/applications/my` | APPLICANT | List own applications |
| `GET` | `/api/applications/queue` | BNR staff | Role-filtered work queue |
| `GET` | `/api/applications/{id}` | Any authenticated | Application detail |
| `GET` | `/api/applications/{id}/audit` | Any authenticated | Audit timeline |
| `POST` | `/api/applications/{id}/submit-name-approval` | APPLICANT | Request name approval |
| `POST` | `/api/applications/{id}/approve-name` | COMPLIANCE_OFFICER | Approve institution name |
| `POST` | `/api/applications/{id}/submit` | APPLICANT | Formal application submission |
| `POST` | `/api/applications/{id}/start-completeness-check` | COMPLIANCE_OFFICER | Begin completeness review |
| `POST` | `/api/applications/{id}/assign-case-manager` | COMPLIANCE_OFFICER | Assign case manager |
| `POST` | `/api/applications/{id}/start-fit-and-proper` | CASE_MANAGER | Start F&P assessment |
| `POST` | `/api/applications/{id}/start-technical-review` | TECHNICAL_REVIEWER | Begin technical review |
| `POST` | `/api/applications/{id}/review/request-info` | TECHNICAL_REVIEWER, LEGAL_OFFICER, FIT_AND_PROPER_OFFICER | Request additional info |
| `POST` | `/api/applications/{id}/additional-info/respond` | APPLICANT | Submit additional information |
| `POST` | `/api/applications/{id}/complete-technical-review` | TECHNICAL_REVIEWER | Complete technical review |
| `POST` | `/api/applications/{id}/start-legal-review` | LEGAL_OFFICER | Begin legal review |
| `POST` | `/api/applications/{id}/complete-legal-review` | LEGAL_OFFICER | Complete legal review |
| `POST` | `/api/applications/{id}/grant-approval-in-principle` | LICENSING_COMMITTEE | Grant AIP with conditions |
| `POST` | `/api/applications/{id}/deny-approval-in-principle` | LICENSING_COMMITTEE | Deny AIP |
| `POST` | `/api/applications/{id}/request-inspection` | INSPECTION_OFFICER | Schedule pre-license inspection |
| `POST` | `/api/applications/{id}/submit-inspection-report` | INSPECTION_OFFICER | Submit inspection results |
| `POST` | `/api/applications/{id}/confirm-fee-payment` | COMPLIANCE_OFFICER, ADMIN | Confirm license fee received |
| `POST` | `/api/applications/{id}/issue-license` | GOVERNOR_DELEGATE | Issue final license |
| `POST` | `/api/applications/{id}/documents` | APPLICANT | Upload document (max 5MB) |
| `GET` | `/api/applications/{id}/documents` | Any authenticated | List application documents |
| `GET` | `/api/applications/{id}/documents/{docId}` | Any authenticated | Download document |
| `POST` | `/api/fit-and-proper/{appId}/assessments` | FIT_AND_PROPER_OFFICER | Create F&P assessment |
| `GET` | `/api/public/license-register` | Public | Licensed institutions register |
| `GET` | `/api/audit/applications/{id}` | AUDITOR, ADMIN | Application audit trail |
| `GET` | `/api/audit/global` | ADMIN | Global audit log (paginated) |
| `GET` | `/api/admin/users` | ADMIN | List all users |
| `PATCH` | `/api/admin/users/{id}/deactivate` | ADMIN | Deactivate a user |

---

## Design Document

See [`DESIGN.md`](./DESIGN.md) for:

- Full system architecture and rationale
- Complete state machine with all 20 states and transitions
- Role permission matrix
- Audit trail tamper-proof design
- Concurrency control approach
- SLA clock design
- Hard decisions and trade-offs

---

## Project Structure

```
.
├── README.md                          ← You are here
├── DESIGN.md                          ← Full design document
├── licensing-compliance-portal-backend/
│   ├── src/main/java/rw/bnr/licensing/
│   │   ├── config/                    ← Security, JWT filter, database seeder
│   │   ├── controller/                ← REST controllers (auth, applications, docs, audit, admin)
│   │   ├── domain/entity/             ← JPA entities (Application, User, AuditEntry, ...)
│   │   ├── domain/enums/              ← ApplicationStatus, UserRole, AuditAction, ...
│   │   ├── domain/repository/         ← Spring Data repositories
│   │   ├── dto/                       ← Request/Response DTOs
│   │   ├── exception/                 ← GlobalExceptionHandler, typed exceptions
│   │   ├── security/                  ← PortalUserPrincipal, access denied handlers
│   │   ├── service/                   ← Business logic (ApplicationService, StateMachineService, ...)
│   │   └── scheduled/                 ← AIP expiry scheduler
│   ├── src/main/resources/
│   │   ├── application.yml            ← Main config
│   │   ├── application-dev.yml        ← Dev profile (H2 or PostgreSQL)
│   │   ├── application-test.yml       ← Test profile (H2 in-memory)
│   │   └── db/migration/              ← Flyway SQL migrations (V1–V10)
│   └── src/test/java/rw/bnr/licensing/
│       ├── StateMachineTest.java      ← State machine unit tests
│       ├── AuthorizationTest.java     ← Role-permission integration tests
│       ├── ConcurrencyTest.java       ← Concurrent access test (optimistic locking)
│       ├── SlaClockTest.java          ← SLA clock lifecycle tests
│       ├── AuthControllerIntegrationTest.java
│       ├── DocumentIntegrationTest.java
│       ├── SecurityIntegrationTest.java
│       └── PublicRegisterIntegrationTest.java
└── licensing-compliance-portal-ui/
    ├── app/
    │   ├── (auth)/login/              ← Login page
    │   ├── (applicant)/               ← Applicant-facing portal (server-side role guard)
    │   ├── (bnr)/                     ← BNR staff portal (server-side role guard)
    │   └── (public)/                  ← Public license register
    ├── components/                    ← Shared UI components
    ├── lib/api.ts                     ← Typed API client
    └── types/                         ← Shared TypeScript types
```

---

## What Was Deliberately Left Out

See DESIGN.md §19 for the full documented out-of-scope list, including:

- Email/SMS notifications
- Multi-factor authentication
- File encryption at rest
- Appeal process for rejected applications
- Second failed inspection escalation to committee
- Audit log export to PDF / SIEM integration
