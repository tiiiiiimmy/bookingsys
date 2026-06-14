# Frontend E2E Test Suite 2.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the expanded backlog in `test/doc/test-cases.md` (the ⬜ items: TC-BK-04…12, TC-RS-02…11, TC-OD-02…06, TC-AD-03…11) as Playwright + playwright-bdd scenarios, reusing the 1.0 harness.

**Architecture:** Extend the existing `test/` suite. New Gherkin scenarios go into the existing feature files plus one new `admin/management.feature`. New behaviors are expressed through additions to the existing page objects, `support/db.ts`, `support/api.ts`, and `support/fixtures.ts`, plus `data-testid`s added to the admin/manage/order/confirmation UIs. Stripe stays fully mocked (forged signed webhook); assertions span UI + API + DB. Scenarios that depend on backend behavior we have not yet confirmed are gated behind Phase 0 spikes.

**Tech Stack:** `@playwright/test`, `playwright-bdd`, `mysql2`, TypeScript (test side); React 19 + Vite (frontend `data-testid`s); .NET 10 + MySQL 8 (backend, read-only here unless a spike says otherwise).

**Baseline facts (verified):**
- Admin API: `POST /admin/auth/login` → `{ data: { accessToken, refreshToken } }`; `POST /admin/auth/refresh`; `GET /admin/auth/me`; `GET /admin/bookings?status&search&from&to`; `GET /admin/bookings/:id`; `POST /admin/bookings/:id/reschedule`; `POST /admin/reschedule-requests/:id/approve|reject` (`{ adminNote }`).
- `frontend/src/services/api.js`: 401 interceptor refreshes then clears tokens + redirects to `/admin/login`, except `/admin/auth/login` and `/admin/auth/refresh`.
- Booking confirm/cancel logic lives in `BookingService.HandlePaymentIntentSucceededAsync` (confirms only if hold valid + no overlap, else cancels with review reason).
- Product orders: `product_orders.status` pending→paid; no failed-status handler today.
- Availability: `AvailabilityController` / `AvailabilityService` (business hours + blocks); booking slot API requires duration a multiple of 30.

---

## File structure

```
test/
  features/
    booking/booking.feature          # +TC-BK-04..06, 07, 11, 12 scenarios
    booking/reschedule.feature        # +TC-RS-02..11 scenarios
    booking/concurrency.feature       # NEW: TC-BK-08, 09, 10 (backend-timing)
    order/product-order.feature       # +TC-OD-02..06 scenarios
    admin/login.feature               # +TC-AD-03..06 (guard/refresh/session)
    admin/management.feature          # NEW: TC-AD-07..11 (list/detail/reschedule/availability)
  steps/
    booking.steps.ts                  # + booking + conflict + validation steps
    reschedule.steps.ts               # + reschedule extended steps
    order.steps.ts                    # + product extended steps
    admin.steps.ts                    # + guard/refresh/session steps
    admin-management.steps.ts         # NEW
  pages/
    BookingPage.ts                    # + multi-slot, conflict, validation helpers
    BookingConfirmationPage.ts        # + payment-failed / processing assertions
    ManageBookingPage.ts              # + history / load-error / disabled assertions
    ProductOrderPage.ts               # + not-found / payment-error / validation
    AdminBookingsPage.ts              # + filters, select, detail, approve/reject, manual reschedule
    AdminAvailabilityPage.ts          # NEW
  support/
    db.ts                             # + group/plural/seed/expire helpers
    api.ts                            # + token pair, reject, refresh, admin GETs
    fixtures.ts                       # + adminToken + new page-object fixtures
```

**TDD note (unchanged from 1.0):** the `.feature` + steps are the RED artifact; add `data-testid`/page-object/helper to reach GREEN; commit per task.

**Tagging convention:** the suite uses Gherkin tags for layering — `@smoke` marks the few fast, stable happy paths (currently: booking pays→confirmed, product order paid, admin login). Run via `npm run test:smoke` (`playwright test --grep @smoke`); the default unfiltered run is regression. **The 2.0 backlog scenarios are NOT `@smoke`** — they are negatives, edge cases, concurrency, and admin-management depth. The one exception: tag the Task 1.4 verification scenario `Admin session › Seeded admin lands directly on bookings` with `@smoke` (it is a fast happy-path session check). Do not expand `@smoke` beyond one core path per module.

---

## Phase 0 — Backend-contract spikes

These resolve the exact messages/shapes the assertions need. Each spike reads backend code and records the answer in this plan's task that consumes it. No app changes unless a spike explicitly calls for one.

### Task 0.1: Booking conflict + hold-expiry contract ✅
- Read: `backend/Services/BookingService.cs` (`CreateBookingAsync`, `EnsureSlotIsAvailableAsync`, `HasOverlappingBookingAsync`, `HandlePaymentIntentSucceededAsync`, `GetEffectiveStatus`/`IsExpired`).
- **Findings:**
  - `POST /api/bookings` (route `api/bookings`). Slot-taken errors, both **409 Conflict**: `"Selected time slot is no longer available"` (requested slot not in the available set — e.g. already booked/blocked/past) and `"Time slot conflicts with existing booking"` (overlap re-check at insert). Duration errors **400**: `"Selected slot must match service duration of {N} minutes"`, `"Booking duration must be a multiple of 30 minutes"`, `"End time must be after start time"`, `"Booking duration is invalid"`.
  - **A confirmed (or non-expired pending) booking REMOVES its slot from `GET /api/availability/slots`** (`GetBookingsAsync` includes `pending`/`confirmed`/`arrived` with live holds). ⇒ For TC-BK-07/08 the conflicting slot is **absent in the UI**, not an error banner. Asserting via direct `POST /api/bookings` to that time yields 409 `"Selected time slot is no longer available"`.
  - Pending hold = `bookings.status='pending'` + `expires_at = NOW()+30min`. A pending hold is ignored by availability/overlap once `expires_at <= NOW()`.
  - Succeeded webhook on an **expired/conflicting** booking ⇒ `bookings.status='cancelled'`, `cancellation_reason="Payment succeeded after the booking hold expired or conflicted. Manual review or refund may be required."`, `payments.status='succeeded'`.
  - `GetEffectiveStatus` maps a pending+expired+unpaid booking to the synthetic display status `"expired"` (raw row stays `pending`). `IsExpired` = `expires_at <= now AND payment != 'succeeded'`.
  - Columns confirmed for seeding: `bookings(customer_id, service_type_id, technician_id, start_time, end_time, duration_minutes, status, created_via, payment_mode, price_cents, notes, manage_token, booking_group_token, expires_at, cancellation_reason)`; `payments(booking_id, stripe_payment_intent_id, amount_cents, currency, status)`; `customers(first_name, last_name, email, phone)`.
- Output feeds: TC-BK-07 (assert slot absent), TC-BK-08, TC-BK-09, TC-BK-10.

### Task 0.2: Reschedule rules contract ✅
- Read: `AdminOperationsController.cs`, `BookingManagementController.cs`, `BookingService` (`CreateRescheduleRequestAsync`, `ApproveRescheduleRequestAsync`, `RejectRescheduleRequestAsync`, `GetBookingByManageTokenAsync`).
- **Findings:**
  - **Customer create:** `POST /api/bookings/manage/{token}/reschedule-request` → **201** `{ data: RescheduleRequestDto, message: "Reschedule request created" }`. Errors: blocked statuses `cancelled/completed/no_show/arrived` → **400** `"This booking can no longer be rescheduled"`; duration → **400** (same strings as 0.1); availability → **409** (same two strings as 0.1); existing pending → **409** `"There is already a pending reschedule request for this booking"`.
  - `ManagedBookingDto.CanRequestReschedule = (status == "confirmed" || status == "pending")` — drives the manage-page submit enabled/disabled state.
  - **Admin approve:** `POST /api/admin/reschedule-requests/{id}/approve` body `{ adminNote }` → **200** `message: "Reschedule request approved"`. Side-effects: `bookings.start_time/end_time` ← requested times; request → `approved` + `reviewed_at`; **all OTHER pending requests for the same booking → `rejected`** with `admin_note="Another reschedule request was approved."`. Re-approving a non-pending request → **400** `"Reschedule request has already been reviewed"`. Note: approve re-validates availability/duration (can 409/400).
  - **Admin reject:** `POST /api/admin/reschedule-requests/{id}/reject` → **200** `message: "Reschedule request rejected"`. Only the request row → `rejected` (SQL `WHERE status='pending'`); **booking times unchanged**. If not pending/not found → **404** `"Pending reschedule request not found"`.
- Output feeds: TC-RS-02..11.

### Task 0.3: Auth refresh contract ✅
- Read: `frontend/src/services/api.js` interceptor + `AdminController.cs`.
- **Findings:**
  - 401 interceptor (skips `/admin/auth/login` + `/admin/auth/refresh`, once per request via `_retry`): reads `localStorage.refreshToken`; `POST {API_URL}/admin/auth/refresh` body `{ refreshToken }`; on success reads `response.data.data.accessToken`, stores it, retries original request with new bearer. On failure: removes `accessToken` + `refreshToken`, `window.location.href = '/admin/login'`.
  - `POST /api/admin/auth/login` → `{ data: { accessToken, refreshToken, ... } }`; `POST /api/admin/auth/refresh` → `{ data: { accessToken, ... } }` (RefreshResultDto, access only).
  - **Simulate in browser:** TC-AD-04 (refresh succeeds) → keep a valid `refreshToken`, overwrite `localStorage.accessToken` with a garbage/expired JWT, then trigger a protected admin API (navigate to an admin data page) → 401 → interceptor refreshes → page loads, no redirect. TC-AD-05 (refresh fails) → set BOTH tokens to garbage → refresh 401 → tokens cleared + redirect to `/admin/login`.
  - Triggering the 401 needs a protected GET (e.g. `/api/admin/bookings` or `/api/admin/auth/me`); the admin pages issue these on load.
- Output feeds: TC-AD-04, TC-AD-05.

### Task 0.4: Product-order failure + availability validation contract ✅
- Read: `ProductOrderService.cs`, `ProductOrderConfirmationPage.jsx`, `AvailabilityController.cs`/`AvailabilityService.cs`, `BookingService.HandlePaymentIntentSucceededAsync`.
- **Findings:**
  - **Product orders never write a `payments` row** — they store `stripe_payment_intent_id` on `product_orders`. The `payment_intent.payment_failed` handler only `UPDATE payments …` ⇒ **no-op for product orders**. `payment_intent.succeeded`: BookingService finds no payment record, falls through to `ProductOrderService.HandlePaymentSucceededAsync` ⇒ `product_orders.status` `pending`→`paid`. **There is no `failed` status for product orders.**
  - ⇒ TC-OD-04/05: a failed (or never-sent) product payment leaves `product_orders.status='pending'`. Confirmation page (`ProductOrderConfirmationPage.jsx`): `isPaid = status ∈ {paid, fulfilled}`; heading `"Processing Payment"` while pending vs `"Order Confirmed"` when paid; **`data-testid="order-status-badge"` `data-status={order.status}` already present** (hidden span). Page polls `getById` every 5s. So assert `data-status=pending` + "Processing Payment". TC-OD-05 = same assertion as TC-OD-04 (documented: failed product payment stays pending by design; no backend change).
  - **Availability validation that EXISTS:** business hours `PUT /api/availability/admin/business-hours/{day}` → invalid day → **400** `"Invalid day of week. Must be 0-6"`; unparseable time → **400** `"Start time and end time must be valid times"`. Block `POST /api/availability/admin/blocks` end≤start → **400** `"End time must be after start time"`. `DELETE /api/availability/admin/blocks/{id}` missing → **404** `"Availability block not found"`.
  - **Validation that does NOT exist:** business-hours `start > end` is **not** checked (only time-parse + day range). ⇒ TC-AD-11 marks that single case `test.fixme`.
  - Public availability endpoint for cross-checks: `GET /api/availability/slots?date=YYYY-MM-DD&duration=N`. Slot generation is `[open, close)` in 30-min steps; a slot is emitted only if `slotEnd <= close`.
- Output feeds: TC-OD-04, TC-OD-05, TC-AD-10, TC-AD-11.

- [x] Commit: `docs(test): record backend contracts for e2e 2.0 (phase 0 spikes)` (update this plan's task notes in place).

---

## Phase 1 — Shared harness additions

### Task 1.1: DB helpers for groups, seeding, and expiry
**Files:** Modify `test/support/db.ts`
- [ ] **Step 1 (RED):** add scenario `TC-BK-04` step that calls `getBookingsByEmail` (test fails: function missing).
- [ ] **Step 2 — add helpers (signatures):**
  - `getBookingsByEmail(email: string): Promise<Array<{ id: number; status: string; start_time: string }>>` — all bookings for a customer (group assertions).
  - `getRescheduleRequestsByBookingId(bookingId: number): Promise<Array<{ id: number; status: string }>>` — plural variant of the existing singular helper; keep the singular too.
  - `insertConfirmedBooking(input: { email: string; startTime: string; endTime: string; serviceTypeId: number; technicianId?: number | null }): Promise<{ bookingId: number; customerId: number }>` — directly INSERTs a `customers` row, a `bookings` row with `status='confirmed'`, and a succeeded `payments` row, to create a pre-existing conflict. Key logic: reuse the column names confirmed in Task 0.1; wrap in a transaction.
  - `expireBookingHold(bookingId: number): Promise<void>` — `UPDATE bookings SET expires_at = NOW() - INTERVAL 1 HOUR WHERE id = ?`.
  - `getBookingStatusReason(bookingId: number): Promise<{ status: string; cancellation_reason: string | null }>` — for TC-BK-10/09 assertions.
- [ ] **Step 3:** extend `cleanupCustomer` to also delete any customer created by `insertConfirmedBooking` (same email convention).
- [ ] **Step 4 (GREEN) + Commit:** `test(e2e): db helpers for group/seed/expiry assertions`.

### Task 1.2: API helpers — token pair, reject, refresh, admin GETs
**Files:** Modify `test/support/api.ts`
- [ ] Replace `adminLogin` return with a token pair: `adminLoginTokens(email?, password?): Promise<{ accessToken: string; refreshToken: string }>`; keep `adminLogin(): Promise<string>` returning `accessToken` for existing callers (delegates to `adminLoginTokens`).
- [ ] Add `rejectRescheduleRequest(token: string, requestId: number, adminNote?: string): Promise<Response>` — POST `/admin/reschedule-requests/:id/reject`; return the raw response so tests can assert non-OK on already-reviewed.
- [ ] Add `approveRescheduleRequestRaw(token, requestId, adminNote?): Promise<Response>` — like the existing approve but returns the `Response` (for the already-reviewed error assertion in TC-RS-09).
- [ ] Add `refreshAccessToken(refreshToken: string): Promise<Response>` — POST `/admin/auth/refresh` `{ refreshToken }`.
- [ ] Add `adminGetBookings(token: string, params: Record<string,string>): Promise<any[]>` — GET `/admin/bookings` with `Authorization` + query params; returns `body.data`.
- [ ] Commit: `test(e2e): api helpers for token pair, reject, refresh, admin list`.

### Task 1.3: `adminToken` fixture + register new page objects
**Files:** Modify `test/support/fixtures.ts`
- [ ] Add fixture `adminToken: string` — resolves via `adminLogin()` once per scenario that needs API-driven admin actions.
- [ ] Add fixtures `adminBookingsPage: AdminBookingsPage`, `adminAvailabilityPage: AdminAvailabilityPage`, `manageBookingPage: ManageBookingPage`, `productOrderPage: ProductOrderPage` (constructed from `page`). Keep the Stripe-block `page` override.
- [ ] Commit: `test(e2e): adminToken fixture and new page-object fixtures`.

### Task 1.4: Authenticated admin session — skip UI login (foundational)
**Files:** Modify `test/support/api.ts`, `test/support/fixtures.ts`
- [ ] **Step 1:** `support/api.ts` — `seedAdminAuthInBrowser(page: Page, tokens?: { accessToken: string; refreshToken: string }): Promise<void>`. Key logic: if `tokens` omitted, call `adminLoginTokens()` (Task 1.2). Then `page.addInitScript` to write **both** keys into `localStorage` BEFORE app scripts run, so `AuthContext` boots authenticated:
  ```ts
  await page.addInitScript(([a, r]) => {
    localStorage.setItem('accessToken', a);
    localStorage.setItem('refreshToken', r);
  }, [tokens.accessToken, tokens.refreshToken]);
  ```
  (Keys are `accessToken` / `refreshToken`, confirmed against `AuthContext.jsx` + `api.js`. `addInitScript` re-applies on every navigation, so it survives `goto`.)
- [ ] **Step 2:** `support/fixtures.ts` — add fixture `adminPage: Page` (an already-authenticated page): builds on `page`, calls `seedAdminAuthInBrowser(page)`, then `use(page)`. Admin-UI scenarios depend on `adminPage` and go straight to `/admin/...` — no login screen.
- [ ] **Step 3 (verify):** a smoke scenario `Admin session › Seeded admin lands directly on bookings` — tag it `@smoke` (per Tagging convention) — `Given I am authenticated as admin` (uses `adminPage`), `When I open the admin bookings page` (`goto('/admin/bookings')`), `Then I land on the admin bookings page` (existing `AdminBookingsPage.expectLoaded()` — URL stays `/admin/bookings`, no redirect to `/admin/login`). Confirms the skip works.
- [ ] **Consumers:** Phase 3 Task 3.3 (admin approve/reject) and all of Phase 5.2/5.3/5.4 use `adminPage` instead of `AdminLoginPage.login()`. The real UI-login flow stays covered by TC-AD-01/02 (Phase 5.1), which keep using `AdminLoginPage`.
- [ ] Commit: `test(e2e): authenticated adminPage fixture to skip UI login`.

---

## Phase 2 — Booking extended (TC-BK-04..12)

### Task 2.1: Multi-slot group confirmation (TC-BK-04)
**Files:** `booking.feature`, `booking.steps.ts`, `BookingPage.ts`
- [ ] Scenario `Booking › Customer books multiple slots and all are confirmed` — steps: select bookable service, go to next week, **select two slots**, proceed, fill, submit, payment succeeds, then `Then all bookings for the customer are confirmed`.
- [ ] `BookingPage.selectFirstSlots(count: number): Promise<void>` — click the first `count` `booking-slot-item` buttons.
- [ ] Step `all bookings for the customer are confirmed` → `getBookingsByEmail(email)` length ≥ 2 and every `status === 'confirmed'`.
- [ ] Commit: `test(e2e): TC-BK-04 multi-slot group confirmation`.

### Task 2.2: Payment-failed UI copy + confirmation-page polling (TC-BK-05, TC-BK-06)
**Files:** `booking.feature`, `booking.steps.ts`, `BookingConfirmationPage.ts`, `frontend/src/pages/BookingConfirmationPage.jsx`
- [ ] Add `data-testid="booking-payment-status"` + `data-payment-status={booking.payment_status}` to the payment-status chip wrapper (mirror the existing `booking-status-badge` pattern).
- [ ] `BookingConfirmationPage.expectPaymentStatus(expected: string)` — assert `data-payment-status` attribute.
- [ ] `BookingConfirmationPage.expectProcessing()` — assert status badge `data-status` is `pending` (webhook not yet sent).
- [ ] Scenario TC-BK-05 `… payment fails → confirmation shows payment-failed`: after `the payment fails`, open confirmation, `expectPaymentStatus('failed')`.
- [ ] Scenario TC-BK-06 `… confirmation starts processing then confirms`: open confirmation **before** webhook → `expectProcessing()`; send succeeded webhook; `expectStatus('confirmed')` (existing poll covers the update).
- [ ] Commit: `test(e2e): TC-BK-05/06 payment-failed copy and confirmation polling`.

### Task 2.3: Slot-conflict message (TC-BK-07)
**Files:** `booking.feature`, `booking.steps.ts`, `BookingPage.ts`, `frontend/src/pages/BookingPage.jsx`
- [ ] Seed a conflicting confirmed booking at the target slot via `insertConfirmedBooking` (in a Given), then attempt to book the same slot.
- [ ] Add `data-testid="booking-error"` to the booking page's error banner element.
- [ ] `BookingPage.expectError(message: RegExp)` — assert `booking-error` contains the conflict copy from Task 0.1.
- [ ] Note: if a conflicting confirmed booking removes the slot from availability entirely, this becomes the TC-BK-08 path instead — Task 0.1 decides; if so, assert the slot is absent rather than an error banner.
- [ ] Commit: `test(e2e): TC-BK-07 slot conflict surfaced in UI`.

### Task 2.4: Form validation (TC-BK-11)
**Files:** `booking.feature`, `booking.steps.ts`, `BookingPage.ts`
- [ ] Use a `Scenario Outline` `Booking › Booking form rejects invalid input` with an `Examples` table covering: missing service/time, missing first/last/email/phone, invalid email format, past date, non-30-min duration (the last two assert at the availability/slot layer, not the form).
- [ ] `BookingPage.submitExpectingClientError(): Promise<void>` — submit and assert the booking is NOT created (no `POST /bookings` 2xx, or HTML5 validation blocks submit). Key logic: most cases are client-side `required`/`type=email` validation, so assert the form stays on step 2 and no booking row exists for the email.
- [ ] Commit: `test(e2e): TC-BK-11 booking form validation`.

### Task 2.5: Availability edge cases (TC-BK-12)
**Files:** `booking.feature`, `booking.steps.ts`, `BookingPage.ts`
- [ ] Scenarios driven by seeded business hours/blocks: closed day (no `booking-slot-item`), slot exactly at open time present, slot ending exactly at close present, blocked-period overlap hides slots. Use the availability API/DB facts from Task 0.4 to choose concrete dates/times.
- [ ] `BookingPage.expectNoSlots()` — assert zero `booking-slot-item` for the visible week.
- [ ] Commit: `test(e2e): TC-BK-12 availability edge cases`.

---

## Phase 3 — Reschedule extended (TC-RS-02..11)

### Task 3.1: Manage page — history, load error, disabled states (TC-RS-02, 03, 04)
**Files:** `reschedule.feature`, `reschedule.steps.ts`, `ManageBookingPage.ts`, `frontend/src/pages/ManageBookingPage.jsx`
- [ ] Add `data-testid="manage-booking-summary"`, `data-testid="manage-reschedule-history"`, and `data-testid="manage-load-error"` to the corresponding elements.
- [ ] `ManageBookingPage.expectLoaded()`, `expectLoadError()`, `expectHistoryVisible()`, `expectRescheduleDisabled()` (the submit button has `disabled` when `!canRequestReschedule`).
- [ ] TC-RS-02: open a confirmed booking's manage page → summary + (after submit) one pending request in DB (`getRescheduleRequestsByBookingId` length 1, status pending).
- [ ] TC-RS-03: open `/booking/manage/unknown-token` → `expectLoadError()`, no form.
- [ ] TC-RS-04: seed/transition the booking to `cancelled` (via `db.ts` update or admin status API) → `expectRescheduleDisabled()`.
- [ ] Commit: `test(e2e): TC-RS-02/03/04 manage page states`.

### Task 3.2: Reschedule request conflicts (TC-RS-05, TC-RS-06)
**Files:** `reschedule.feature`, `reschedule.steps.ts`, `ManageBookingPage.ts`
- [ ] TC-RS-05: submit one reschedule request, then submit a second → assert the existing-pending conflict message (string from Task 0.2) via `manage-reschedule-result`/error element.
- [ ] TC-RS-06: open the manage page, seed a conflicting confirmed booking at the intended target slot via `insertConfirmedBooking`, then submit → assert rejection and `getRescheduleRequestsByBookingId` shows no new pending.
- [ ] Commit: `test(e2e): TC-RS-05/06 reschedule request conflicts`.

### Task 3.3: Admin approve/reject via UI + DB cross-checks (TC-RS-07, TC-RS-08)
**Files:** `reschedule.feature`, `reschedule.steps.ts`, `AdminBookingsPage.ts`, `frontend/src/pages/admin/BookingsPage.jsx`
- [ ] Add `data-testid`s: `admin-booking-row` (per row), `admin-reschedule-approve` / `admin-reschedule-reject` (per pending request), `admin-reschedule-request` (request row with a `data-status`).
- [ ] `AdminBookingsPage.selectBookingByEmail(email)` (click the matching `admin-booking-row`), `approvePendingReschedule()` / `rejectPendingReschedule()` — both must handle the `window.prompt` adminNote via `page.on('dialog', d => d.accept(''))` (set before the click).
- [ ] TC-RS-07: admin logs in (UI), selects the booking, approves → assert admin request row `data-status=approved`, customer manage UI shows updated dates, and DB `bookings.start_time/end_time` equal the requested values (`getBookingByEmail` + a new `getBookingTimes(bookingId)` helper).
- [ ] TC-RS-08: admin rejects → request `data-status=rejected`, DB booking times unchanged (compare to pre-reject snapshot).
- [ ] Commit: `test(e2e): TC-RS-07/08 admin approve/reject via UI`.

### Task 3.4: Already-reviewed + concurrency + multi-pending (TC-RS-09, 10, 11)
**Files:** `reschedule.feature`, `reschedule.steps.ts`, `support/api.ts`, `support/db.ts`
- [ ] TC-RS-09: approve a request via API, then call `approveRescheduleRequestRaw`/`rejectRescheduleRequest` again → assert non-OK (already-reviewed) and booking times unchanged.
- [ ] TC-RS-10: create one pending request; fire two `approveRescheduleRequestRaw` calls via `Promise.all` → exactly one OK, the other non-OK ("already reviewed"/not found).
- [ ] TC-RS-11: seed two pending requests for one booking (submit one via UI + insert a second via `db.ts insertPendingReschedule(bookingId, start, end)`), approve one → assert the other becomes `rejected` (per Task 0.2 side-effect).
- [ ] Add `db.ts insertPendingReschedule(bookingId, startTime, endTime): Promise<number>`.
- [ ] Commit: `test(e2e): TC-RS-09/10/11 reschedule review edge cases`.

---

## Phase 4 — Product order extended (TC-OD-02..06)

### Task 4.1: Per-product success (TC-OD-02)
**Files:** `product-order.feature`, `order.steps.ts`
- [x] `Scenario Outline` over `Examples`: `White Magic`, `Love Spell`, `Money Spell` — reuse existing order steps parameterized by product name; assert `product_orders.status=paid`.
- [x] Commit: `test(e2e): TC-OD-02 per-product success path`.

### Task 4.2: Unknown product + payment error + pending (TC-OD-03, 04, 05)
**Files:** `product-order.feature`, `order.steps.ts`, `ProductOrderPage.ts`, `frontend/src/pages/ProductOrderPage.jsx`, `ProductOrderConfirmationPage.jsx`
- [x] Add `data-testid="order-not-found"` (the "Product not found" block) and `data-testid="order-error"` (payment error).
- [x] TC-OD-03: open `/order?product=Nope` → `ProductOrderPage.expectProductNotFound()`; assert no `product_orders` row for the test email.
- [x] TC-OD-04: submit order, then send a `payment_intent.payment_failed` webhook (or skip webhook per Task 0.4) → open confirmation, assert order stays `pending` (`order-status-badge` `data-status=pending`) and processing copy shows.
- [x] TC-OD-05: documented as the same assertion as TC-OD-04 unless Task 0.4 adds a backend failed-status handler; if not, mark with a note that failed product payments remain `pending` by design.
- [x] Commit: `test(e2e): TC-OD-03/04/05 unknown product and non-paid states`.

### Task 4.3: Order form validation (TC-OD-06)
**Files:** `product-order.feature`, `order.steps.ts`, `ProductOrderPage.ts`
- [x] `Scenario Outline`: missing first/last/email, invalid email → `ProductOrderPage.submitExpectingClientError()` (no `POST /product-orders` 2xx; HTML5 validation blocks); phone/intention optional (a success variant with them empty).
- [ ] Commit: `test(e2e): TC-OD-06 order form validation`.

---

## Phase 5 — Admin extended (TC-AD-03..11)

### Task 5.1: Route guard + token refresh + session (TC-AD-03, 04, 05, 06)
**Files:** `admin/login.feature` (or new `admin/session.feature`), `admin.steps.ts`, `support/api.ts`
- [ ] TC-AD-03: with no token, `page.goto('/admin/bookings')` → `expect(page).toHaveURL(/admin\/login/)`.
- [ ] TC-AD-04: log in (UI), overwrite `localStorage.accessToken` with an expired/garbage JWT (per Task 0.3), trigger an admin API action (navigate to a data-loading admin page) → assert the request retries after refresh and the page loads (no redirect).
- [ ] TC-AD-05: overwrite both tokens with invalid values, trigger an admin action → tokens cleared + redirect to `/admin/login`.
- [ ] TC-AD-06: two tabs (two `page`s in one context); log out in tab A (`AdminLoginPage`/header logout clears localStorage), perform an action in tab B → tab B 401s → redirect to login.
- [ ] Add `data-testid="admin-logout"` to the logout control if missing.
- [ ] Commit: `test(e2e): TC-AD-03..06 guard, refresh, session`.

### Task 5.2: List filters + booking detail (TC-AD-07, TC-AD-08)
**Files:** `admin/management.feature`, `admin-management.steps.ts`, `AdminBookingsPage.ts`, `frontend/src/pages/admin/BookingsPage.jsx`
- [ ] Add `data-testid`s: `admin-filter-status`, `admin-filter-search`, `admin-filter-from`, `admin-filter-to`, `admin-booking-row`, and detail fields `admin-detail-customer|service|time|payment-status|manage-token|reschedule-requests`.
- [ ] `AdminBookingsPage.applyFilters({ status?, search?, from?, to? })`, `expectRowsForEmail(email)`, `openDetailByEmail(email)`, `expectDetailContains(field, value)`.
- [ ] TC-AD-07: seed a known confirmed booking (UI flow earlier in the scenario), filter by status `confirmed` and by search text (customer email) → matching row visible; filter by a non-matching status → row absent.
- [ ] TC-AD-08: open detail → assert customer/service/time/payment-status/manage-token/reschedule-requests render with expected values.
- [ ] Commit: `test(e2e): TC-AD-07/08 admin list filters and detail`.

### Task 5.3: Admin manual reschedule (TC-AD-09)
**Files:** `admin/management.feature`, `admin-management.steps.ts`, `AdminBookingsPage.ts`, `frontend/src/pages/admin/BookingsPage.jsx`
- [ ] Add `data-testid`s: `admin-reschedule-start`, `admin-reschedule-end`, `admin-reschedule-submit` on the admin manual-reschedule form.
- [ ] `AdminBookingsPage.manualReschedule(startIso: string, endIso: string)` — fill datetime inputs + submit; waits for the reschedule response.
- [ ] TC-AD-09: select a confirmed booking, manual-reschedule to a valid future slot (duration matches service) → success message + DB `bookings.start_time/end_time` updated; a duration-mismatch attempt → error (string from Task 0.2), DB unchanged.
- [ ] Commit: `test(e2e): TC-AD-09 admin manual reschedule`.

### Task 5.4: Availability management + negatives (TC-AD-10, TC-AD-11)
**Files:** `admin/management.feature`, `admin-management.steps.ts`, `AdminAvailabilityPage.ts` (NEW), `frontend/src/pages/admin/AvailabilityPage.jsx`
- [ ] Add `data-testid`s on `AvailabilityPage.jsx`: `availability-day-toggle-<n>` (or a generic `availability-day-row` with `data-day`), `availability-start-<n>`, `availability-end-<n>`, `availability-save-<n>`, `availability-block-start`, `availability-block-end`, `availability-block-create`, `availability-block-item` (+ `availability-block-delete`), `availability-error`.
- [ ] `AdminAvailabilityPage` (NEW): `open()`, `setBusinessDay(day, { open, start, end })`, `createBlock(startIso, endIso)`, `deleteFirstBlock()`, `expectError(message)`.
- [ ] TC-AD-10: toggle a business day open/closed, edit start/end, create a block, delete it → after each, assert the public availability slot API reflects the change (call `GET /availability/slots` via `support/api.ts` or re-open the public booking page) and DB rows updated.
- [ ] TC-AD-11: negatives — invalid day, block `end < start`, delete an already-deleted block → `expectError(...)`; business-hours `start > end` is currently unenforced (Task 0.4) → mark that single case `test.fixme` with a comment until the backend validates it.
- [ ] Commit: `test(e2e): TC-AD-10/11 availability management and negatives`.

---

## Phase 6 — Docs + run

### Task 6.1: Update test-cases statuses and run a full report
- [ ] Flip implemented backlog rows in `test/doc/test-cases.md` from ⬜ to ✅ (leave any `test.fixme` as ⬜ with a note).
- [ ] Run `cd test && npm run test:e2e` (full regression); record a new versioned report `test/doc/reports/run-00N-<date>.md` (run #, timestamp, pass/fail/flaky) and add a row to `test/doc/test-report.md`.
- [ ] Verify the smoke subset still works: `npm run test:smoke` runs only the `@smoke`-tagged scenarios (3 from 1.0 + the Task 1.4 admin-session check) and passes.
- [ ] Commit: `docs(test): e2e 2.0 results and updated case statuses`.

---

## Self-review

- **Spec coverage:** every backlog ID maps to a task — TC-BK-04→2.1, 05/06→2.2, 07→2.3, 08/09/10→`concurrency.feature` (Phase 0.1 + steps folded into 2.3/3.x where seeded), 11→2.4, 12→2.5; TC-RS-02/03/04→3.1, 05/06→3.2, 07/08→3.3, 09/10/11→3.4; TC-OD-02→4.1, 03/04/05→4.2, 06→4.3; TC-AD-03/04/05/06→5.1, 07/08→5.2, 09→5.3, 10/11→5.4. **Gap:** TC-BK-08/09/10 (concurrency/expiry) need `concurrency.feature` scenarios explicitly — add them in Phase 2 alongside Task 2.3 using `insertConfirmedBooking`/`expireBookingHold`; they are otherwise only referenced. Action: add Task 2.6 below.
- **Placeholders:** none — each task names files, scenario titles, helper/page-object signatures, and the assertion. Uncertain backend strings are deferred to named Phase 0 spikes (concrete inspections, not TBDs).
- **Type consistency:** `adminLogin(): string` retained for existing callers; `adminLoginTokens()` added for the pair — both named consistently. `getRescheduleRequestByBookingId` (singular, existing) kept; `getRescheduleRequestsByBookingId` (plural) added — distinct names used intentionally.

### Task 2.6: Concurrency & hold-expiry (TC-BK-08, 09, 10)
**Files:** `booking/concurrency.feature` (NEW), `booking.steps.ts`, `support/db.ts`, `support/api.ts`
- [ ] TC-BK-08: customer A books a slot (pending, no webhook); customer B attempts the same slot → B blocked before payment with the conflict copy from Task 0.1 (assert via `booking-error` or slot-absent per 0.1).
- [ ] TC-BK-09: both A and B reach payment for the same slot (seed B's pending via `insertPendingBooking` if the UI blocks it), send A succeeded then B succeeded → A `confirmed`, B `cancelled` with review reason (`getBookingStatusReason`).
- [ ] TC-BK-10: book a slot, `expireBookingHold(bookingId)`, send succeeded webhook → booking `cancelled` + `payments.status=succeeded` (`getBookingStatusReason` + payment row).
- [ ] Add `db.ts insertPendingBooking(...)` mirroring `insertConfirmedBooking` with `status='pending'` + future `expires_at` if Task 0.1 shows the UI cannot create the second pending directly.
- [ ] Commit: `test(e2e): TC-BK-08/09/10 concurrency and hold expiry`.
