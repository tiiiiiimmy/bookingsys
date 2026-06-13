# Frontend E2E + BDD Test Design

Status: Draft for review · Date: 2026-06-14

## 1. Background & current state

- App: `bookingsys` — a massage booking system.
  - Frontend: React 19 + Vite, plain JS/JSX, runs on `http://localhost:3000`.
  - Backend: .NET 10 + MySQL 8, runs on `http://localhost:5000/api`. Has `--migrate` and `--seed` commands. Seed creates the admin account (`admin@massage.com` / `admin123`), service types, and business hours.
  - Auth: JWT access + refresh tokens stored in `localStorage`.
  - Payment: Stripe "pay-first-then-confirm" flow (Stripe Elements iframe). Confirmation arrives via a Stripe webhook that flips the booking/order status to `confirmed`.
- Current tests: **none**. No test tooling installed.
- Key user journeys: booking + payment, reschedule (`/booking/manage/:token`) with admin approve/reject, admin login + management, and the product order/checkout flow (`/order`).

## 2. Goals & scope

In scope (this phase — frontend-first):

- Playwright UI E2E covering the public + admin user journeys.
- API Integration coverage of the frontend↔backend contract for those journeys.
- Run against a **real** .NET backend, isolated on a dedicated test database.
- Verify critical flows at three levels: UI, API response, and **actual DB state**.

Out of scope (later phases):

- A standalone backend unit/integration test layer.
- Real third-party calls (Stripe/email are mocked).
- Performance / load testing.

## 3. Confirmed decisions


| Area           | Decision                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Frameworks     | Playwright only. **No Jest / no Vitest.**                                                                                                                                                                                      |
| Suites         | UI E2E + API Integration.                                                                                                                                                                                                      |
| BDD            | Full Gherkin `.feature` files via `playwright-bdd`.                                                                                                                                                                            |
| Language       | **TypeScript** for the test suite only (does not touch the JS app build).                                                                                                                                                      |
| Backend        | Real running .NET backend.                                                                                                                                                                                                     |
| Database       | Dedicated isolated `**app_test`** DB, never production data.                                                                                                                                                                   |
| DB lifecycle   | Migrate + Seed once before the suite (admin, services, hours). Per-test isolation via uniquified data (timestamped emails, future dates). Cleanup via automated teardown / transaction rollback — not full per-scenario wipes. |
| DB assertions  | Direct `**mysql2`** Node client in the test suite (`mysql2` = Node MySQL driver, fully MySQL-8 compatible incl. `caching_sha2_password`).                                                                                      |
| Critical flows | Verify UI **+** API response **+** real DB record/state (transaction commit & consistency).                                                                                                                                    |
| Third-party    | Stripe / email → mocked for success/failure/exception.                                                                                                                                                                         |
| Selectors      | `data-testid` on every element a test touches/asserts, kebab-case convention.                                                                                                                                                  |
| Locations      | All test content under `test/`. All docs under `test/doc/`.                                                                                                                                                                    |


## 4. Architecture

### 4.1 Tooling stack

- `@playwright/test` — runner & browser automation.
- `playwright-bdd` — compiles Gherkin `.feature` files into Playwright tests via step definitions.
- `mysql2` — Node MySQL client for DB-state assertions and cleanup against `app_test`.
- `dotenv` — loads `test/.env.test` (test DB + test-mode backend config).
- TypeScript + `tsconfig.json` scoped to `test/`.

### 4.2 Directory layout

```
test/
  doc/                       # all design / plan / test-case docs
    test-design.md           # this document
  features/                  # Gherkin .feature files = the test cases
    booking/book-massage.feature
    booking/reschedule.feature
    order/product-order.feature
    admin/login.feature
    admin/manage-bookings.feature
  steps/                     # step definitions (Given/When/Then -> actions)
    booking.steps.ts
    order.steps.ts
    admin.steps.ts
    common.steps.ts
  pages/                     # page objects; ONLY place data-testid selectors live
  support/
    global-setup.ts          # bring up app_test: migrate + seed; verify servers up
    db.ts                    # mysql2 helpers: query / cleanup app_test
    stripe-mock.ts           # mock success / failure / exception
    auth.ts                  # admin login fixture (token into localStorage)
    env.ts                   # typed access to test env
  playwright.config.ts
  .env.test
  tsconfig.json
  package.json               # test-suite deps & scripts (or folded into frontend)
```

## 5. Test data & environment strategy

- **Isolation**: a dedicated `app_test` MySQL database, configured via `test/.env.test`. The real/production DB is never touched.
- **Baseline**: `global-setup.ts` runs the backend `--migrate` then `--seed` once before the suite, guaranteeing admin, service types, and business hours exist.
- **Per-test independence**: every scenario generates unique data — timestamped customer emails (e.g. `cust+<ts>@test.local`), future booking dates — and asserts only on what it created, so scenarios never collide and are re-runnable.
- **Cleanup**: automated teardown removes data the scenario created; transaction rollback is used where applicable (backend integration context). No full per-scenario DB wipe.

## 6. Third-party mocking strategy

The frontend uses real Stripe Elements; final confirmation is webhook-driven on the backend. To make outcomes deterministic without real charges:

- **Proposed approach (to validate)**: a backend **test mode** enabled via `test/.env.test` that (a) stubs the real Stripe charge, and (b) exposes a controllable way for tests to inject the webhook outcome — `succeeded` / `failed` / `error`. The frontend test completes the payment step; the injected outcome drives the resulting status (`confirmed` vs not).
- **Email**: stubbed in the same test mode; tests assert a notification *record* exists (via API or DB) rather than a real send.
- **OPEN — planning spike #1**: the exact mechanism depends on backend Stripe/webhook code not yet read. The first task in the implementation plan is a spike to inspect the backend payment path and finalize this. Fallback options if no test hook exists: Stripe test-mode cards with deterministic outcomes, or Playwright network interception of the Stripe call.

## 7. Selector convention (`data-testid`)

- Add `data-testid` to every element a test interacts with or asserts on (not literally every DOM node).
- Format: `data-testid="<area>-<element>[-modifier]"`, kebab-case.
- Examples: `booking-service-option`, `booking-slot-item`, `booking-submit`, `booking-status-badge`, `admin-login-email`, `admin-login-submit`, `product-card`, `order-pay-button`.
- Page objects reference elements exclusively via `getByTestId`; raw selectors are not used in steps.

## 8. The complete test process

1. **Test Plan** (`test/doc/test-plan.md`): scope, layers, environment, data strategy, risk areas, exit criteria.
2. **Test Cases**: authored as Gherkin scenarios under `test/features/` (business-readable).
3. **Automation**: `playwright-bdd` binds steps to page objects + fixtures + DB/Stripe helpers.
4. **Execution**: `npm run e2e` → `global-setup` (migrate+seed `app_test`, ensure backend+frontend up) → run scenarios → HTML report + traces on failure. Identical command in CI.

## 9. Code-audit findings for the requested coverage

This section records what is already visible in the current app code. It is a static implementation audit, not a completed automated test run.

- **Booking + payment**
  - Public booking creates pending `bookings` rows and a pending `payments` row before the customer reaches Stripe checkout.
  - Successful Stripe webhook changes the booking or booking group to `confirmed` only if the hold is still valid and no overlapping booking exists.
  - Failed Stripe webhook changes only `payments.status` to `failed`; booking status remains unconfirmed/pending and the confirmation page renders the payment-failed state from `payment_status`.
  - Slot conflict is checked twice: once before creating the pending booking/payment, and again on successful webhook before confirming.
  - Pending, unexpired bookings block availability, so a second customer is normally stopped before reaching payment for the same slot.
- **Reschedule**
  - `/booking/manage/:token` loads the managed booking and submits `POST /bookings/manage/:token/reschedule-request`.
  - Customer reschedule requests validate duration and target slot availability, and only one pending request per booking is allowed.
  - Admin approve updates `bookings.start_time/end_time`, marks the request `approved`, and rejects any other still-pending requests for the same booking.
  - Admin reject marks only the request `rejected`; the booking dates are not updated.
- **Product order**
  - `/order` creates a pending `product_orders` row and Stripe PaymentIntent.
  - Successful Stripe webhook updates `product_orders.status` to `paid`.
  - There is no explicit product-order failed-payment DB status handler in the current backend; the UI surfaces immediate Stripe confirmation errors, but the confirmation page otherwise keeps polling and displays "Processing Payment" for pending orders.
- **Admin**
  - Login success stores `accessToken` and `refreshToken` in `localStorage`; login failure shows the API error.
  - Admin routes are protected by `AdminLayout`; API 401 responses try refresh, then clear tokens and redirect to `/admin/login`.
  - Logout in one browser tab removes shared `localStorage` tokens, but other already-open admin tabs do not proactively update their visible UI. Their next API action should 401 and redirect.
  - Availability UI supports business-hour updates and blocked-period create/delete. Backend validates invalid day and block end-before-start, but business-hour start-before-end is not currently enforced.

## 10. Expanded scenario backlog

- **Booking**
  - Book one available slot, complete successful payment, then assert UI status `confirmed`, DB `bookings.status = confirmed`, and DB `payments.status = succeeded`.
  - Book multiple selected slots in one checkout, complete successful payment, then assert every booking in the group is `confirmed`.
  - Trigger Stripe payment failure from checkout, then assert UI shows payment-failed copy, DB payment is `failed`, and DB booking is not `confirmed`.
  - Open confirmation immediately after payment success and assert it starts as processing/pending if webhook has not arrived, then updates after webhook polling.
  - Select a slot that another confirmed booking already occupies, submit details, and assert the UI shows the backend conflict message.
  - Two customers select the same slot from the availability page at nearly the same time: customer A creates the pending payment first; customer B should be blocked before reaching payment with "Selected time slot is no longer available" or "Time slot conflicts with existing booking".
  - Two customers somehow both reach payment for the same slot: customer A payment webhook succeeds and confirms; customer B payment webhook succeeds later but booking becomes `cancelled` with conflict/expired review reason, not `confirmed`.
  - Pending hold expires before payment success: webhook success should not confirm the booking; booking becomes `cancelled` and payment is `succeeded` for manual review/refund.
  - Form validation: missing service/time, missing first name, last name, email, phone, invalid email format, duplicate slot ranges, invalid time range, duration mismatch, past date, and non-30-minute duration.
  - Availability edge cases: closed business day, blocked period overlap, slot exactly at business open, slot ending exactly at business close, adjacent non-overlapping bookings.
- **Reschedule**
  - Customer opens `/booking/manage/:token`, sees current booking and history, chooses a new available slot, submits request, and DB has one `pending` reschedule request.
  - Invalid/unknown manage token shows the managed-booking load error and no form actions are possible.
  - Cancelled/completed/no-show/arrived booking cannot submit a reschedule.
  - Customer attempts a second pending request for the same booking and receives the existing-pending-request conflict.
  - Requested slot becomes unavailable after customer opened the page but before submit; submit is rejected and no pending request is created.
  - Admin approves a pending request, then assert admin UI, customer manage UI, and DB booking dates all match the requested dates.
  - Admin rejects a pending request, then assert request status is `rejected` and DB booking dates remain exactly unchanged.
  - Admin tries to approve/reject an already reviewed request and receives an error; booking dates do not change again.
  - Two admins review the same request concurrently: the first successful action wins; the second receives "already reviewed" / not found pending behavior.
  - Multiple pending requests exist due to seeded/pre-existing data: approving one rejects the other pending requests for the same booking.
- **Product order**
  - `/order?product=White+Magic` creates pending order, successful payment leads to confirmation UI and DB `product_orders.status = paid`.
  - Repeat successful path for each catalog product: White Magic, Love Spell, Money Spell.
  - Unknown product query shows "Product not found" and creates no DB row.
  - Immediate Stripe confirmation failure shows the payment error and leaves DB order pending.
  - Webhook/payment failure for product orders should be clarified: either add backend support for failed status or assert that order stays `pending` and the UI remains processing.
  - Form validation: required first name, last name, email; optional phone/intention; invalid email.
- **Admin**
  - Login success redirects to dashboard and stores tokens.
  - Login failure keeps user on login and shows "Invalid credentials".
  - Access admin route without token redirects to `/admin/login`.
  - Expired access token with valid refresh token refreshes and retries the original request.
  - Expired/invalid refresh token clears tokens and redirects to `/admin/login`.
  - Two admin pages open in same browser: logout in page A, then perform an API action in page B; page B should redirect to login after 401.
  - List bookings with no filters and with filters: status, date range, search text.
  - Booking detail displays customer, service, time, payment status, manage token, and reschedule requests.
  - Admin manual reschedule validates duration and slot conflicts, updates UI and DB on success.
  - Manage availability: toggle a business day open/closed, edit start/end times, create block, delete block, and assert future public slots reflect the changes.
  - Manage availability negative cases: invalid day, end before start for block, deleting an already deleted block, and business hours with start after end once backend validation exists.

## 11. Risks & open questions

- **Stripe test hook** (spike #1) — confirmation determinism depends on backend internals.
- **Stripe Elements iframe** — filling the card may require the real Stripe test iframe even when the charge is stubbed; the page object must target the iframe robustly.
- **Token refresh interceptor** — `api.js` redirects to `/admin/login` on 401; tests must seed valid tokens to avoid accidental redirects.
- **Backend startup time** in `global-setup` — needs a readiness wait/health check before scenarios run.
- **Product order payment failure persistence** — booking payments persist `failed`; product orders currently do not appear to persist a failed payment state.
- **Cross-tab logout UX** — current behavior relies on the next API call, not proactive storage-event sync.
- **Business-hours validation** — backend parses times but does not currently reject `startTime >= endTime`.

## 12. Phased implementation & TODO

- **Phase 0 — Spike**: read backend Stripe/webhook path; finalize the mock mechanism (Section 6).
- **Phase 1 — Scaffold**: install Playwright + playwright-bdd + mysql2; create `test/` layout, `playwright.config.ts`, `tsconfig.json`, `.env.test`; `npm run e2e` runs an empty suite green.
- **Phase 2 — Infrastructure**: `global-setup` (migrate+seed `app_test`, server readiness), `db.ts` helpers, `auth.ts` fixture, `stripe-mock.ts`.
- **Phase 3 — `data-testid` pass**: add ids to the components the backlog touches, per the convention.
- **Phase 4 — First vertical**: booking happy path end-to-end (feature + steps + page objects + UI/API/DB assertions) as the reference pattern.
- **Phase 5 — Remaining scenarios**: reschedule, product order, admin.
- **Phase 6 — Test plan doc + CI**: write `test-plan.md`, wire CI execution + reports.
