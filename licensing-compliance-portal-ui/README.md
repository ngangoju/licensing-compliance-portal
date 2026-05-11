# BNR Licensing Portal — Frontend

> Next.js 14 (App Router) · TypeScript · Tailwind CSS
>
> The applicant-facing and BNR internal portal for the National Bank of Rwanda Bank Licensing & Compliance system. All role enforcement happens server-side at the layout level — role-gated pages are never sent to the browser for unauthorised users.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Role-Based Routing](#role-based-routing)
- [Design System](#design-system)
- [Key Components](#key-components)
- [API Integration](#api-integration)
- [Running Tests](#running-tests)
- [Build for Production](#build-for-production)

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| pnpm | 8+ |

Install pnpm if needed:

```bash
npm install -g pnpm
```

The backend must be running on **http://localhost:8080** before starting the frontend. See the root `README.md` for backend setup.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| Components | shadcn/ui (headless, accessible primitives) |
| Icons | lucide-react |
| Forms | react-hook-form |
| HTTP client | Typed fetch wrapper (`lib/api.ts`) |
| Auth | Server-side session via `getServerSession()` in layout guards |
| Fonts | Playfair Display (headings) · Source Sans 3 (body) · JetBrains Mono (reference numbers, amounts) |

---

## Getting Started

```bash
# From the project root
cd licensing-compliance-portal-ui

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The app runs on **http://localhost:3000**.

For the public licence register (no login required): http://localhost:3000

For the login page: http://localhost:3000/login

---

## Environment Variables

Create a `.env.local` file in `licensing-compliance-portal-ui/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

That is the only required variable for local development. The API URL must point to the running Spring Boot backend.

---

## Project Structure

```
licensing-compliance-portal-ui/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          ← Login page (public)
│   │   └── register/
│   │       └── page.tsx          ← Applicant self-registration (public)
│   ├── (public)/
│   │   └── page.tsx              ← Public licence register (no auth)
│   ├── (applicant)/
│   │   ├── layout.tsx            ← Server-side role guard: APPLICANT only
│   │   ├── dashboard/
│   │   │   └── page.tsx          ← Applicant dashboard + application list
│   │   └── applications/
│   │       ├── new/
│   │       │   └── page.tsx      ← Multi-step new application wizard
│   │       └── [id]/
│   │           └── page.tsx      ← Application detail + document uploads
│   ├── (bnr)/
│   │   ├── layout.tsx            ← Server-side role guard: all BNR roles
│   │   ├── dashboard/
│   │   │   └── page.tsx          ← Role-specific dashboard (routed by role)
│   │   ├── applications/
│   │   │   ├── page.tsx          ← Application queue (role-filtered)
│   │   │   └── [id]/
│   │   │       └── page.tsx      ← Full application detail + workflow actions
│   │   ├── audit/
│   │   │   └── page.tsx          ← Audit log viewer (AUDITOR, ADMIN)
│   │   └── admin/
│   │       └── users/
│   │           └── page.tsx      ← User management (ADMIN)
│   ├── globals.css               ← BNR design tokens (CSS custom properties)
│   └── layout.tsx                ← Root layout (fonts, metadata)
├── components/
│   ├── ui/
│   │   ├── BackButton.tsx        ← Consistent back navigation
│   │   ├── StatusBadge.tsx       ← Application status chips
│   │   ├── SlaWidget.tsx         ← SLA clock display with pause state
│   │   ├── DocumentUploadZone.tsx← Drag-and-drop file upload
│   │   ├── ReasonModal.tsx       ← Mandatory reason input for rejection actions
│   │   └── ToastNotification.tsx ← Success / warning / error toasts
│   ├── dashboards/
│   │   ├── compliance-dashboard.tsx
│   │   ├── technical-reviewer-dashboard.tsx
│   │   ├── fit-and-proper-dashboard.tsx
│   │   ├── legal-officer-dashboard.tsx
│   │   ├── inspection-officer-dashboard.tsx
│   │   ├── committee-dashboard.tsx
│   │   ├── delegate-dashboard.tsx
│   │   ├── case-manager-dashboard.tsx
│   │   ├── admin-dashboard.tsx
│   │   └── auditor-dashboard.tsx
│   ├── applicant-application-detail-client.tsx
│   └── bnr-application-detail-client.tsx
├── lib/
│   ├── api.ts                    ← Typed fetch wrapper with JWT attach + 401 refresh
│   ├── auth.ts                   ← getServerSession() and session helpers
│   └── constants.ts              ← Status labels, RBAC maps, required document lists
└── types/
    └── index.ts                  ← Shared TypeScript interfaces and enums
```

---

## Role-Based Routing

The App Router layout system enforces role access server-side. No page HTML is sent to a user who does not hold the correct role.

```
/                       → Public licence register (no auth)
/login                  → Login page (no auth)
/register               → Applicant self-registration (no auth)

/(applicant)/*          → APPLICANT role only
  /dashboard            → Application list + stats
  /applications/new     → Multi-step application wizard
  /applications/[id]    → Detail view + document uploads

/(bnr)/*                → All BNR staff roles (COMPLIANCE_OFFICER, TECHNICAL_REVIEWER,
  /dashboard              FIT_AND_PROPER_OFFICER, LEGAL_OFFICER, INSPECTION_OFFICER,
  /applications           LICENSING_COMMITTEE, GOVERNOR_DELEGATE, ADMIN, AUDITOR)
  /applications/[id]
  /audit                → AUDITOR, ADMIN only
  /admin/users          → ADMIN only
```

The dashboard at `/bnr/dashboard` is a single route that renders a different component based on the authenticated user's role. No BNR role sees another role's queue or action panels.

---

## Design System

BNR brand tokens are defined as CSS custom properties in `globals.css` and consumed throughout via Tailwind utilities.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bnr-brown` | `#3D1C00` | Primary actions, headers, headings |
| `--bnr-brown-700` | `#5C2D00` | Button hover states |
| `--bnr-gold` | `#C8921A` | Accents, active nav links, gold actions |
| `--bnr-cream` | `#F5E6C0` | Secondary backgrounds, table headers |
| `--bnr-cream-light` | `#FAF3E0` | Page background, card backgrounds |
| `--bnr-text` | `#1A0A00` | Primary text |
| `--bnr-text-muted` | `#6B4226` | Labels, secondary text, eyebrows |
| `--bnr-text-on-dark` | `#F5E6C0` | Text on dark brown backgrounds |

### Typography

| Family | Usage | CSS variable |
|--------|-------|-------------|
| Playfair Display | Page titles, section headings | `--font-display` |
| Source Sans 3 | Body text, labels, buttons | `--font-body` |
| JetBrains Mono | Reference numbers, amounts, timestamps | `--font-mono` |

### Border Radius Rules

- Buttons and inputs: `4px` (`rounded` in Tailwind) — never `rounded-full` or `rounded-xl`
- Cards and panels: `8px` (`rounded-lg`) maximum
- Status badges: `9999px` (`rounded-full`) — the only exception

### Prohibited Styles

No component in this codebase uses:
- `bg-gradient-*`, `from-*`, `to-*`, or `linear-gradient` — all surfaces are flat solid colors
- `rounded-full` on buttons or inputs
- Raw enum strings in the UI (e.g., `DEVELOPMENT_FINANCE_INSTITUTION`) — always pass through label maps in `constants.ts`

---

## Key Components

### `StatusBadge`

Renders a human-readable, correctly colored status chip for every `ApplicationStatus` value. Import and use wherever a status is displayed — never render raw enum strings.

```tsx
import { StatusBadge } from '@/components/ui/StatusBadge'

<StatusBadge status={application.status} />
// Renders: "Name Approved" in indigo, not "NAME_APPROVED"
```

### `SlaWidget`

Displays the SLA clock with pause state awareness. Hidden automatically when the clock has not yet started (before `CASE_ASSIGNED`).

```tsx
import { SlaWidget } from '@/components/ui/SlaWidget'

<SlaWidget sla={application.sla} />
// Shows remaining working days, PAUSED badge + reason when paused,
// color-coded green → amber → red as deadline approaches
```

### `DocumentUploadZone`

Drag-and-drop upload zone. Must always receive `disabled={false}` when the current status is in the writable stages list. Never shows a restriction error on a card that already has an uploaded document.

```tsx
import { DocumentUploadZone } from '@/components/ui/DocumentUploadZone'

<DocumentUploadZone
  applicationId={id}
  documentType="BUSINESS_PLAN"
  label="Business Plan (3-Year Projection)"
  disabled={!isWritableStage(application.status)}
  onUploadSuccess={refetchDocuments}
/>
```

Writable stages: `DRAFT`, `NAME_APPROVED`, `SUBMITTED`, `INCOMPLETE`, `ADDITIONAL_INFO_REQUESTED`, `ORGANIZATION_PERIOD`.

### `ReasonModal`

Required for all actions that produce a negative outcome for the applicant. Enforces a minimum character count. Cannot be dismissed by clicking the backdrop.

```tsx
import { ReasonModal } from '@/components/ui/ReasonModal'

<ReasonModal
  isOpen={isRejectModalOpen}
  title="Reject Institution Name"
  actionLabel="Reject Name"
  placeholder="Provide a clear reason the applicant can act on..."
  minLength={20}
  variant="danger"
  onConfirm={async (reason) => {
    await rejectName(applicationId, reason)
  }}
  onCancel={() => setIsRejectModalOpen(false)}
/>
```

### `BackButton`

Consistent back navigation with an explicit `href` — never relies on `router.back()` alone, which fails on fresh page loads.

```tsx
import { BackButton } from '@/components/ui/BackButton'

<BackButton label="Back to My Applications" href="/applicant/dashboard" />
```

---

## API Integration

All HTTP calls go through the typed wrapper in `lib/api.ts`. It attaches the JWT access token from the session, handles `401` → token refresh → retry automatically, and throws a typed `ApiError` on failure.

```typescript
import { apiFetch } from '@/lib/api'

// GET
const application = await apiFetch<ApplicationDetail>(`/api/applications/${id}`)

// POST
await apiFetch(`/api/applications/${id}/approve-name`, {
  method: 'POST',
  body: JSON.stringify({ reason }),
})
```

Errors are caught and displayed as inline `ToastNotification` messages. No raw API error messages are shown to users — all error codes are mapped to human-readable strings in `constants.ts`.

---

## Running Tests

```bash
pnpm test
```

Key frontend test coverage:

| Test | What it covers |
|------|---------------|
| `StatusBadge.test.tsx` | Renders human-readable label for every `ApplicationStatus` value; never renders raw enum strings |
| `WorkflowActionPanel.test.tsx` | Correct panel shown per role × status; waiting message shown when no action available |
| `DocumentUploadZone.test.tsx` | No restriction error shown on uploaded-file cards; error only on empty zones in restricted stages |
| `ReasonModal.test.tsx` | Submit disabled below minimum character count; does not close on backdrop click |

---

## Build for Production

```bash
pnpm build
pnpm start
```

The build output is in `.next/`. Set `NEXT_PUBLIC_API_URL` to the production backend URL before building.

```bash
NEXT_PUBLIC_API_URL=https://api.licensing.bnr.rw pnpm build
```