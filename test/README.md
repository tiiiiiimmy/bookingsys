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
├── README.md                       # This file — the suite guide
├── package.json                    # Scripts: test:e2e / test:api / test:smoke / test:regression / test:e2e:ui / test:report
├── playwright.config.ts            # Single chromium project; webServer (backend :5001 + Vite :3000), globalSetup, serial, retries:2, NO_PROXY bypass, html/junit/list reporters
├── tsconfig.json                   # TypeScript (ESM, moduleResolution: Bundler)
├── .env.test(.example)             # Test env: DB_*, API_URL (:5001), STRIPE_*, ADMIN_* — real .env.test is gitignored
├── .gitignore
├── features/                       # playwright-bdd Gherkin (.feature) — what to test
│   ├── booking/
│   │   ├── booking.feature         # TC-BK-* pay success/fail, bad signature, multi-slot, confirmation polling, form validation, availability edges
│   │   ├── concurrency.feature     # @api slot conflict, concurrent holds, hold expiry
│   │   └── reschedule.feature      # TC-RS-* manage-page states, duplicate/conflict requests, admin approve/reject
│   ├── order/
│   │   └── product-order.feature   # TC-PO-* per-product success, unknown product, unpaid stays pending, form validation
│   └── admin/
│       ├── login.feature           # TC-AD-* admin login success / failure
│       ├── session.feature         # Route guard, token refresh, invalid tokens, dual-tab logout
│       └── management.feature      # Filters, detail, manual reschedule, availability management (+ negatives)
├── steps/                          # Step definitions (Given/When/Then) — call page objects only
│   ├── booking.steps.ts            # Booking flow + forged Stripe webhook + DB assertions
│   ├── reschedule.steps.ts         # Reschedule request / admin approve-reject flow
│   ├── order.steps.ts              # Product-order flow via ProductOrderPage
│   ├── admin.steps.ts              # Admin login / session steps
│   ├── admin-management.steps.ts   # Admin filters / detail / manual reschedule / availability
│   └── common.steps.ts            # After / AfterAll: per-scenario cleanup + close DB pool
├── pages/                          # Page Object Model — data-testid selectors + actions
│   ├── BasePage.ts                 # Shared helpers: fill() by testId, waits, navigation
│   ├── BookingPage.ts              # Select service / slot(s), fill customer, submit & capture payment
│   ├── BookingConfirmationPage.ts  # Confirmation badge (data-status) + status polling
│   ├── ManageBookingPage.ts        # Customer manage link: pick date/slot, submit reschedule request
│   ├── ProductOrderPage.ts         # Spell-product checkout: fill customer, submit & capture payment
│   ├── AdminLoginPage.ts           # Admin login form
│   ├── AdminBookingsPage.ts        # Admin bookings list/detail, filters, manual reschedule
│   └── AdminAvailabilityPage.ts    # Business hours + blocked-period management
├── support/                        # Harness & helpers
│   ├── env.ts                      # Loads .env.test; refuses non-"test" DB_NAME; backendProcessEnv()
│   ├── global-setup.ts             # Once per run: dotnet --migrate then --seed against the test DB
│   ├── backend.ts                  # runBackendCommand(--migrate/--seed), waitForUrl() readiness probe
│   ├── fixtures.ts                 # Extends test with page objects + unique email + stripe.com route.abort(); re-exports Given/When/Then/Before/After
│   ├── db.ts                       # mysql2 pool + direct asserts/cleanup (getBookingByEmail, cleanupCustomer, …)
│   ├── api.ts                      # API wrappers: adminLogin, getAvailableSlots, bookSlotViaApi, approve/reject, availability blocks
│   ├── stripe-mock.ts              # Forge signed / unsigned Stripe webhooks (payment_intent.succeeded|failed)
│   ├── seed.ts                     # Per-scenario seeding: confirmed / pending booking next week
│   ├── dates.ts                    # Date helpers: mondayOf, nextWeekOpenDate, findNextWeekSlot
│   └── constants.ts                # BOOKABLE_SERVICE_TYPE_ID, UI/DB timeouts
├── doc/                            # Test documentation
│   ├── test-design.md              # Strategy, layers, trade-offs
│   ├── test-cases.md               # Human-readable case catalog (TC-* with steps + status)
│   ├── test-implementation-plan.md
│   ├── test-implementation-plan-2.0.md
│   ├── test-report.md              # Report index
│   └── reports/                    # Per-run reports (run-NNN-YYYY-MM-DD.md)
└── .features-gen/                  # bddgen output — gitignored; regenerated before every run
```

---

## 8. Reports

Each run produces a numbered, dated report in `doc/reports/`, indexed in [`doc/test-report.md`](doc/test-report.md).
Latest **Run #005**: 54 passed / 0 failed / 0 flaky (1 xfail) — booking, reschedule, product orders, admin session/management; Stripe mocked throughout.
Known gaps: TC-RS-10 (backend concurrency, xfail); TC-AD-11 business-hours `start>end` (backend not validated; not automated).

`playwright.config.ts` emits three reporters: `html` (`playwright-report/`, opened by `test:report`),
`junit` (`test-results/junit.xml`, consumed by CI), and `list` (console). Traces are retained on failure.

---

## 9. CI (Azure Pipelines)

[`azure-pipelines.yml`](../azure-pipelines.yml) (repo root) runs the suite on the self-hosted `Default` pool.
Because the harness starts both servers and runs migrate+seed itself (§4–§5), CI does **not** manually
start/stop the backend or frontend — it only provisions runtimes, ensures the test DB exists, then runs
the npm scripts.

Stage `quality_gate` → 4 jobs:

| Job | What it does |
|---|---|
| `backend_build` | `UseDotNet@2` + `dotnet restore`/`build` (.NET 10) |
| `frontend_build` | `npm ci` + `npm run build` (Vite) |
| `api_tests` | `npm run test:api` on DB `bookingsys_test_api` |
| `e2e_tests` | `npm run test:e2e` on DB `bookingsys_test_e2e` (+ Chromium; HTML report → Azure Blob static site) |

- Each test job uses its **own** `bookingsys_test_*` DB, so the two never share data/slots if the pool runs them in parallel.
- **JUnit** results (`test-results/junit.xml`) are published via `PublishTestResults@2`; the Playwright **HTML report** is uploaded to the Azure Blob static website and attached as a pipeline artifact.
- The TC-RS-10 xfail rides in `api_tests` and reports as passed (Playwright counts expected failures as passing), so it does not red the pipeline.
- **Agent prerequisites**: MySQL 8 reachable + the `mysql` client + `az` CLI (Node and the .NET 10 SDK are provisioned per run).
- **Required pipeline variables** (mark secrets `*`): `DB_PASSWORD`\*, `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`\*, `AZURE_STATIC_SITE_URL`. `DB_*` / `ADMIN_*` / `STRIPE_WEBHOOK_SECRET` carry CI defaults.
