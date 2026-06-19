# Psychic Magic — End-to-End Test Suite

> **You are on the `test/e2e` branch.** This branch carries the full **`test/`** automation tree on top of the
> application code, so you can read, run, and review the whole test suite in one place. The application itself
> ships from `main`; here, the tests are the main event.
>
> **Just want the tests?** Jump to [The Test Suite](#the-test-suite). Deep dive: [`test/README.md`](test/README.md).

The system under test is [Psychic Magic](https://www.psychicmagic.site/) — an online business site for New Zealand
psychic Manon, offering **Psychic Reading appointments** and **spell product purchases**, both paid via Stripe.

---

## What this branch adds

| Branch | Contents |
|--------|----------|
| `main` | Production frontend + backend only |
| **`test/e2e`** (here) | The same app **plus** the complete `test/` tree: Playwright + playwright-bdd scenarios, page objects, DB/API helpers, run reports (**54 automated scenarios**) |

Everything test-related lives under [`test/`](test/). Application setup is summarized in
[Running the app](#running-the-app-system-under-test) further down — but you do **not** need to start anything by
hand to run the tests; the harness boots the backend and frontend for you.

---

## The System Under Test (what the tests exercise)

A guest-checkout booking and product site. Understanding these flows makes the test coverage easy to follow.

**Customer-facing**
- Book a Psychic Reading (15 min $26 / 30 min $48 / 60 min $88) into an available slot, pay via Stripe.
- Order a spell product — White Magic / Love Spell / Money Spell ($88 each, one-time checkout).
- No registration (guest checkout); reschedule via a secure manage link.

**Admin**
- View appointments and product orders; manage status (reschedule, cancel, complete, no-show, fulfill).
- Configure availability (business days, blocked periods); review customer reschedule requests.

**Rules that matter to the tests**
- Payment-first: appointments and orders only confirm after a successful Stripe webhook.
- Double-booking is prevented by DB exclusive constraints.
- Seed defaults: 3 services, business hours Mon–Thu 09:00–17:00, one admin user.

---

## The Test Suite

### At a glance

| | |
|---|---|
| **Total** | **54 automated scenarios** — Run #005: 54 passed / 0 failed / 1 xfail |
| **Browser E2E** | **44** (`npm run test:e2e`) — real browser → API → DB |
| **API / contract** | **10** (`npm run test:api`) — no browser; seed + forged webhooks / direct API asserts |
| **Smoke** | **4** (`npm run test:smoke`) — one happy path per module |
| **Stack** | Playwright + playwright-bdd (Gherkin) · TypeScript (ESM) · MySQL via `mysql2` · .NET 10 backend |
| **What's real / mocked** | Real browser, real backend, real MySQL test DB · Stripe fully **mocked** (no external calls) |

### What's covered

Four business areas; every scenario asserts across **UI → API (webhook) → DB**:

| Module | Scenarios | Anchor assertions |
|---|---|---|
| **Booking** | pay success/fail, bad webhook signature, multi-slot, confirmation polling, slot conflict, concurrency & hold expiry, form validation, availability edges | confirmation badge + `bookings.status` + `payments.status` |
| **Reschedule** | manage-page states, duplicate/conflict requests, admin approve/reject, review edge cases | `booking_reschedule_requests.status` + `bookings` start/end |
| **Product order** | per-product pay success, unknown product, failed/missing webhook stays pending, form validation | confirmation badge + `product_orders.status` |
| **Admin** | login success/fail, session (route guard / refresh / invalid tokens / dual-tab logout), management (filters / detail / manual reschedule / availability) | redirects + list/detail fields + hours/blocks → public availability |

Full human-readable catalog: [`test/doc/test-cases.md`](test/doc/test-cases.md). Design rationale:
[`test/doc/test-design.md`](test/doc/test-design.md).

### How it works

```
features/**/*.feature   Gherkin scenarios — what to test
        │  bddgen
steps/**/*.ts           Step definitions — Given / When / Then
pages/*.ts              Page objects — data-testid selectors + actions
support/*.ts            env, DB, Stripe mock, backend control, fixtures
```

- **Tests start the system, not you.** Playwright `webServer` launches a fresh .NET backend on `:5001` and reuses
  (or starts) the Vite frontend on `:3000`; `globalSetup` runs `--migrate` + `--seed` once per run.
- **Isolated DB.** `DB_NAME` must contain `test` (e.g. `bookingsys_test`) — `support/env.ts` refuses to run otherwise.
  Each scenario uses a unique customer email and cleans up after itself.
- **`data-testid` first.** Steps touch elements by `data-testid`; status badges expose `data-status`, so assertions
  never couple to copy or styling.
- **Stripe fully mocked.** Backend `STRIPE_FAKE_PAYMENTS=true` issues synthetic PaymentIntents; tests forge
  webhooks signed with `STRIPE_WEBHOOK_SECRET` (`support/stripe-mock.ts`). One scenario sends a bad signature to
  assert HTTP 400. The browser also blocks `stripe.com`. No external service is ever called.
- **Serial by design.** Shared DB + competing slots → `workers: 1`, `fullyParallel: false`, `retries: 2`, 90s timeout.

### Run it

```bash
cd test

npm install
npx playwright install chromium

cp .env.test.example .env.test
# Set DB_NAME (must contain "test"), DB_USER/PASSWORD, API_URL (port 5001),
# STRIPE_WEBHOOK_SECRET (any self-consistent value), ADMIN_EMAIL/PASSWORD (match seed)

# Make sure :5001 is free and MySQL is up, then:
npm run test:regression   # Full: browser E2E + API (54)
```

| Command | Purpose | Count |
|---|---|---|
| `npm run test:regression` | Full regression (CI gate) | 54 |
| `npm run test:e2e` | Browser E2E only (excludes `@api`) | 44 |
| `npm run test:api` | API / contract only (`@api`) | 10 |
| `npm run test:smoke` | `@smoke` happy paths | 4 |
| `npm run test:e2e:ui` | Playwright UI mode | — |
| `npm run test:report` | Open the last HTML report | — |

> Stop any dev backend on `:5001` first — the tests run their own backend against the test DB. The `:3000`
> frontend can stay up.

### Tags

- **`@api`** — backend integration peeled out of browser E2E (concurrency / hold expiry / availability contract).
- **`@smoke`** — one happy path per module; the fast gate.
- **`@fail`** — expected failure (xfail), e.g. TC-RS-10 (a known backend defect).

Filter anything with `--grep` / `--grep-invert` by title or tag.

### Reports

Each run is captured as a numbered, dated report in [`test/doc/reports/`](test/doc/reports/), indexed by
[`test/doc/test-report.md`](test/doc/test-report.md). `playwright.config.ts` emits `html`
(`playwright-report/`), `junit` (`test-results/junit.xml`, for CI), and `list` (console); traces are kept on failure.

**Known gaps:** TC-RS-10 (backend reschedule-approval race — xfail); TC-AD-11 business-hours `start>end`
sub-case (backend does not validate; not automated).

### CI (Azure Pipelines)

[`azure-pipelines.yml`](azure-pipelines.yml) runs the suite on a self-hosted pool. Because the harness boots both
servers and runs migrate+seed itself, CI only provisions runtimes, ensures the test DB exists, then runs the npm
scripts. Stage `quality_gate` → `backend_build`, `frontend_build`, `api_tests` (DB `bookingsys_test_api`),
`e2e_tests` (DB `bookingsys_test_e2e`). JUnit results are published; the HTML report is uploaded to Azure Blob.
Details: [`test/README.md`](test/README.md#9-ci-azure-pipelines).

### Read more

- [`test/README.md`](test/README.md) — full suite guide (coverage, design, servers, data, layout, reports, CI)
- [`test/doc/test-cases.md`](test/doc/test-cases.md) — every case, step by step, with status
- [`test/doc/test-design.md`](test/doc/test-design.md) — design and trade-offs

---

## Tech Stack

| Area | Stack |
|---|---|
| Backend (SUT) | .NET 10 + ASP.NET Core + MySQL |
| Frontend (SUT) | React (Vite) |
| Payments | Stripe (mocked in tests) |
| Auth | JWT |
| Tests | Playwright + playwright-bdd + TypeScript (ESM), MySQL via `mysql2` |

## Project Structure

```
bookingsys/
├── backend/          # ASP.NET Core API server (SUT)
│   ├── Controllers/  Services/  Models/  Middleware/
│   ├── Database/          # MySQL connection, migrations, seeding
│   └── Program.cs
├── frontend/         # React frontend (SUT)
│   └── src/  components/  pages/  services/  hooks/  context/
├── test/             # ◀ Playwright + BDD end-to-end tests (this branch)
│   ├── features/         # Gherkin .feature files
│   ├── steps/            # Step definitions
│   ├── pages/            # Page objects
│   ├── support/          # env, global-setup, backend, db, stripe-mock, fixtures
│   ├── doc/              # test-design, test-cases, reports/
│   └── playwright.config.ts
├── azure-pipelines.yml
└── README.md         # This file
```

---

## Running the app (system under test)

You only need this to drive the app by hand — the test suite starts its own copies. Use a **separate, non-test**
database here.

```bash
# Backend
cd backend
dotnet restore BookingSystem.Api.csproj
cp .env.example .env                                            # set DB + Stripe
dotnet run --project BookingSystem.Api.csproj -- --migrate
dotnet run --project BookingSystem.Api.csproj -- --seed
dotnet watch run --project BookingSystem.Api.csproj            # → http://localhost:5000

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env                                            # set API URL + Stripe key
npm run dev                                                     # → http://localhost:3000
```

**Default admin** (from `.env` `ADMIN_EMAIL` / `ADMIN_PASSWORD`; seed fallback if unset):
`admin@massage.com` / `admin123` — ⚠️ change immediately after first login.

**Manual access:** Home `/` · Booking `/booking` · Product checkout `/order?product=White%20Magic` ·
Admin `/admin/login` → `/admin/dashboard`.

---

## API & Data Reference (what the tests assert against)

### Endpoints

**Public:** `GET /health` · `GET /api/bookings/service-types` · `POST /api/bookings` · `GET /api/bookings/:id` ·
`GET /api/bookings/manage/:token` · `POST /api/bookings/manage/:token/reschedule-request` ·
`GET /api/availability/slots` · `POST /api/product-orders` · `GET /api/product-orders/:id` ·
`POST /api/webhooks/stripe`

**Admin:** `POST /api/admin/auth/login` · `/refresh` · `GET /api/admin/auth/me` · `GET /api/admin/dashboard/stats` ·
`GET|PATCH /api/admin/bookings[/:id[/status]]` · `POST /api/admin/bookings/:id/reschedule` ·
`GET /api/admin/customers[/:id]` · `POST /api/admin/reschedule-requests/:id/approve|reject` ·
`GET /api/admin/product-orders` · `PATCH /api/admin/product-orders/:id/fulfill`

### Core tables

`customers` · `bookings` (exclusive constraints prevent double booking) · `payments` · `product_orders` ·
`availability_blocks` · `business_hours` · `admins` · `service_types`

---

## Troubleshooting

- **Backend can't reach DB** — MySQL running? credentials in `.env`? database exists?
- **Frontend can't reach backend** — backend up? `VITE_API_URL` set? CORS OK?
- **Admin can't log in** — re-run `--seed`; use the `.env` admin credentials.
- **Tests fail to start a backend** — free port `:5001`; confirm `DB_NAME` contains `test`; MySQL reachable.
- **SPA blank after long HMR** — restart the `:3000` dev server (see Run #003 §4).

## License

ISC — see also [backend/README.md](backend/README.md).
