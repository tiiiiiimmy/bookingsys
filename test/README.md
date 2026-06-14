# E2E Test Suite

This directory contains **frontend end-to-end (E2E) automation** for the booking system. Tests drive the UI in a real browser,
hit a **real running .NET backend**, and assert against the **MySQL test database**; Stripe is fully mocked.

> All docs live under `doc/`; all test code lives here. Run reports are in `doc/reports/` (numbered + dated per run).

---

## 1. Coverage

Four business areas; assertions span **UI → API (webhooks) → DB**:

| Module | Scenarios | Key assertions |
|---|---|---|
| Booking | Pay success/fail, bad signature, multi-slot, confirmation polling, slot conflict, concurrency & hold expiry, form validation, availability edges | Confirmation badge + `bookings.status` + `payments.status` |
| Reschedule | Manage page states, duplicate/conflict requests, admin UI approve/reject, review edge cases (already reviewed / concurrency / multiple pending) | `booking_reschedule_requests.status` + `bookings` start/end |
| Product order | Per-product pay success, unknown product, failed/missing webhook stays pending, form validation | Confirmation badge + `product_orders.status` |
| Admin | Login success/fail, session (route guard / refresh / invalid tokens / dual-tab logout), management (filters / detail / manual reschedule / availability + negatives) | Redirects + list/detail fields + business hours/blocks → public availability |

**54 scenarios** automated: **44 browser E2E** (`test:e2e`) + **10 API/contract** (`test:api`, no browser).
Full case list and status: [`doc/test-cases.md`](doc/test-cases.md). Design: [`doc/test-design.md`](doc/test-design.md).

---

## 2. Tech Stack

- **Playwright** (`@playwright/test`) — Browser automation (Chromium only).
- **playwright-bdd** — BDD: Gherkin `.feature` → executable specs via `bddgen` into `.features-gen/`.
- **TypeScript** (ESM) — All test code.
- **mysql2/promise** — Direct MySQL 8 assertions and cleanup.
- **.NET 10 + MySQL 8** — System under test; tests start the backend against the test DB.
- No Jest/Vitest; Playwright is the single runner.

---

## 3. Design

### BDD layers
```
features/**/*.feature   Gherkin scenarios (what to test)
        │  bddgen
steps/**/*.ts           Step definitions (Given/When/Then)
pages/*.ts              Page objects (selectors + actions)
support/*.ts            Env, DB, Stripe mock, backend control, fixtures
```

- **Page objects**: Each page (BookingPage, AdminLoginPage, …) wraps `data-testid` selectors; steps call page methods only.
- **`data-testid` first**: Every touched element has `data-testid`; status badges also expose `data-status` — no copy/style coupling.
- **Fixtures** (`support/fixtures.ts`): Inject page objects, per-scenario unique customer email (`cust+<timestamp>@test.local`),
  and `route.abort()` on `stripe.com` (payments are mocked; real Stripe.js is not needed).

### Stripe fully mocked
1. **Backend** `STRIPE_FAKE_PAYMENTS=true`: synthetic PaymentIntents (`pi_fake_<guid>`), no Stripe API calls.
2. **Tests** `support/stripe-mock.ts`: forge signed webhooks (`payment_intent.succeeded` / `payment_intent.payment_failed`)
   with our `STRIPE_WEBHOOK_SECRET`; one scenario uses a bad signature to expect HTTP 400.

### Serial execution
Shared test DB and competing for the same slots → `workers: 1`, `fullyParallel: false`; `retries: 2`, `timeout: 90s` per test.

---

### Tagging

- **`@api`** — No browser: DB seed + forged webhook or direct API asserts (concurrency/hold expiry, TC-RS-09/10/11, availability contract). `npm run test:api`.
- **`@smoke`** — One happy path per module; fast gate. `npm run test:smoke`.
- **Browser E2E** — `npm run test:e2e` (`--grep-invert @api`).
- **Full regression** — `npm run test:regression` (both layers).

Use `--grep` to filter by title/tag. `@fail` = expected failure (xfail, e.g. TC-RS-10). Negative/edge cases are not in `@smoke`.

---

## 4. Servers

Playwright `webServer` starts both services (`playwright.config.ts`); **no manual start required**:

| Service | How | Port | Reuse |
|---|---|---|---|
| .NET backend | `dotnet run` with test env | `:5001` (`API_URL`) | `reuseExistingServer: false` — always a fresh test backend |
| Vite frontend | `npm run dev` in `../frontend` | `:3000` | `reuseExistingServer: true` — reuse if already up |

- Readiness probe: `/health` (no DB), because the backend starts before `globalSetup` migrate+seed.
- `backendProcessEnv()` injects test `DB_*`, `STRIPE_*`, `ADMIN_*`, `PORT`, `STRIPE_FAKE_PAYMENTS=true`.
  With backend `EnvLoader` (env vars override `.env`), **no change to `backend/.env`** is needed for tests.
- Local HTTP proxies: config adds `localhost` to `NO_PROXY` to avoid 502 on readiness checks.

> ⚠️ **Stop any dev backend on `:5001`** before running tests. Frontend `:3000` can stay up; if the SPA goes blank after long HMR, restart the dev server (see Run #003 §4).

---

## 5. Test Data

- **Isolated DB**: `DB_NAME` e.g. `bookingsys_test`. `support/env.ts` **refuses to run** if the name does not contain `test`.
- **migrate + seed**: `support/global-setup.ts` runs `dotnet run -- --migrate` and `-- --seed` once per suite (admin, 3 services, Mon–Thu 09:00–17:00 hours).
- **Uniqueness + cleanup**: Unique email per scenario; `cleanupCustomer()` / `cleanupProductOrder()` in `support/db.ts`.
- **Direct DB asserts**: `getBookingByEmail()`, `getProductOrderByEmail()`, `getRescheduleRequestByBookingId()`, `getManageToken()`, etc.

---

## 6. Quick Start

### Prerequisites
- Node.js + npm, .NET 10 SDK, MySQL 8.
- Test database created (name must include `test`) with read/write access.

### Steps
```bash
cd test

npm install
npx playwright install chromium

cp .env.test.example .env.test
# DB_NAME (must contain test), DB_USER/PASSWORD, API_URL port 5001,
# STRIPE_WEBHOOK_SECRET (any value, self-consistent), ADMIN_EMAIL/PASSWORD (match seed)
# Note: example API_URL may show 5000; use http://localhost:5001/api

# Ensure :5001 is free; MySQL is up

npm run test:regression   # Full: browser E2E + API (54)
npm run test:e2e          # Browser only (44)
npm run test:api          # API/contract only (10)

npm run test:e2e:ui       # Optional: UI mode
npm run test:report       # Open last HTML report
```

### npm scripts
| Command | Purpose | Count |
|---|---|---|
| `npm run test:e2e` | Browser E2E (excludes `@api`) | 44 |
| `npm run test:api` | API/contract (`@api` only) | 10 |
| `npm run test:smoke` | `@smoke` happy paths | 4 |
| `npm run test:regression` | Full regression (CI gate) | 54 |
| `npm run test:e2e:ui` | Playwright UI mode | — |
| `npm run test:report` | Last HTML report | — |

> `@api` scenarios are backend integration tests peeled out of browser E2E; `test:regression` still runs both layers.

---

## 7. Layout

```
test/
├── README.md                 This file
├── package.json              Dependencies and scripts
├── playwright.config.ts      webServer / globalSetup / serial / retries / proxy bypass
├── tsconfig.json             TS (ESM, moduleResolution: Bundler)
├── .env.test(.example)       Env (secrets gitignored)
├── features/                 Gherkin (.feature)
│   ├── booking/  booking.feature, concurrency.feature, reschedule.feature
│   ├── order/    product-order.feature
│   └── admin/    login.feature, session.feature, management.feature
├── steps/                    Step definitions (*.steps.ts)
├── pages/                    Page objects (extend BasePage)
├── support/                  env, global-setup, backend, db, stripe-mock, api, fixtures, …
└── doc/                      Test documentation
    ├── test-design.md
    ├── test-cases.md
    ├── test-implementation-plan.md
    ├── test-implementation-plan-2.0.md
    ├── test-report.md        Report index
    └── reports/              Per-run reports (run-NNN-YYYY-MM-DD.md)
```

---

## 8. Reports

Each run produces a numbered, dated report in `doc/reports/`, indexed in [`doc/test-report.md`](doc/test-report.md).
Latest **Run #005**: 54 passed / 0 failed / 0 flaky (1 xfail) — booking, reschedule, product orders, admin session/management; Stripe mocked throughout.
Known gaps: TC-RS-10 (backend concurrency, xfail); TC-AD-11 business-hours `start>end` (backend not validated; not automated).
