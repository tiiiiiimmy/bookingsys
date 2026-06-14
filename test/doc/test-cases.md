# Test Cases

Date: 2026-06-15 · Module: Frontend E2E (Playwright + BDD)

> Executable cases are Gherkin scenarios in `test/features/**/*.feature`; this document is the human-readable catalog.
> Status from latest Run #005 (54 scenarios green, 1 xfail; see `test/doc/reports/`).
> Legend: ✅ automated & passing ｜ ⚠️ automated, expected fail (xfail, backend defect) ｜ ⬜ not automated (backend gap).
> Default preconditions: backend on `:5001` (`STRIPE_FAKE_PAYMENTS=true`), frontend on `:3000`,
> test DB `bookingsys_test` migrated + seeded (admin, 3 services, Mon–Thu 09:00–17:00 hours).
> Each case uses a unique customer email; data is cleaned up after the scenario.

---

## Module A: Online Booking

Source: `features/booking/booking.feature`

### TC-BK-01 Booking succeeds and payment succeeds
- Pre: On booking page `/booking`.
- Steps:
  1. Select a service with 30-minute slot granularity (e.g. 60 min).
  2. Go to next week (default week may be all past dates).
  3. Select the first available slot.
  4. Fill customer info (name/email/phone), submit; capture `bookingId` + `clientSecret`.
  5. Forge and send signed `payment_intent.succeeded` webhook.
- Expected: Confirmation badge `data-status=confirmed`; DB `status=confirmed`.
- Automation: `Booking › Customer books an available slot and payment succeeds`
- Status: ✅ (Run #003)

### TC-BK-02 Payment failure does not confirm booking
- Pre: On booking page.
- Steps: Same as TC-BK-01 steps 1–4; then send `payment_intent.payment_failed` webhook.
- Expected: DB `status` is not `confirmed`.
- Automation: `Booking › Payment fails and the booking is not confirmed`
- Status: ✅

### TC-BK-03 Invalid webhook signature rejected
- Pre: On booking page.
- Steps: Same as TC-BK-01 steps 1–4; then send webhook with invalid signature.
- Expected: Webhook returns HTTP 400; DB `status` is not `confirmed`.
- Automation: `Booking › A webhook with an invalid signature is rejected`
- Status: ✅

---

## Module B: Product Order

Source: `features/order/product-order.feature`

### TC-OD-01 Product order pays successfully
- Pre: On `/order?product=White Magic`.
- Steps:
  1. Fill customer info (name/email).
  2. Submit order; capture `orderId` + `clientSecret`.
  3. Send `payment_intent.succeeded` webhook.
- Expected: Confirmation badge `data-status=paid`; DB `status=paid`.
- Automation: `Place a product order › Customer orders a product and payment succeeds`
- Status: ✅

---

## Module C: Admin Login

Source: `features/admin/login.feature`

### TC-AD-01 Valid credentials login succeeds
- Pre: On `/admin/login`.
- Steps: Log in as seeded admin `admin@massage.com / admin123`; wait for login response.
- Expected: Redirect to `/admin/dashboard`; can access `/admin/bookings`.
- Automation: `Admin login › Admin signs in with valid credentials`
- Status: ✅ (Run #003; prior failure/fix in run-002 §4.2)

### TC-AD-02 Wrong password shows error
- Pre: On admin login page.
- Steps: `admin@massage.com` + wrong password `wrong-password`.
- Expected: Login error visible `data-testid=admin-login-error`.
- Automation: `Admin login › Admin sign-in fails with wrong password`
- Status: ✅ (Run #003; prior failure/fix in run-002 §4.1)

---

## Module D: Reschedule

Source: `features/booking/reschedule.feature`

### TC-RS-01 Customer requests reschedule; admin approves
- Pre: Confirmed booking exists (TC-BK-01 flow + success webhook); manage token available.
- Steps:
  1. Open `/booking/manage/:token`, pick new date → slot → submit request.
  2. Approve via admin API (`POST /admin/reschedule-requests/{id}/approve` with admin token).
- Expected: DB request `status=approved`.
- Automation: `Reschedule a booking › Customer requests a reschedule and admin approves it`
- Status: ✅ (Run #003)

---

## Coverage Summary (Run #005, 54 executable scenarios)

TC-*-01 entries above are core happy paths per module (some tagged `@smoke`); extended cases are in the backlog below — all automated unless noted.
Two execution layers:

- **Browser E2E (44)** — real browser UI→API→DB, `npm run test:e2e`.
- **API/contract (10, `@api`)** — no browser; DB seed + forged webhook / direct API, `npm run test:api`.
  Backend integration tests peeled from browser E2E; `npm run test:regression` runs both.

| Module | Source feature | E2E | API(@api) | Status |
|---|---|---|---|---|
| Booking | `booking/booking.feature` | 13 | 4 | ✅ |
| Booking concurrency/hold expiry | `booking/concurrency.feature` | 0 | 3 | ✅ |
| Reschedule | `booking/reschedule.feature` | 8 | 3 | ✅ (1 xfail: TC-RS-10) |
| Product order | `order/product-order.feature` | 11 | 0 | ✅ |
| Admin login | `admin/login.feature` | 2 | 0 | ✅ |
| Admin session | `admin/session.feature` | 5 | 0 | ✅ |
| Admin management | `admin/management.feature` | 5 | 0 | ✅ |
| **Total** | | **44** | **10** | **53 pass + 1 xfail** |

> `@api` scenarios: concurrency & hold expiry (TC-BK-08/09/10), reschedule review edges (TC-RS-09/10/11),
> availability API validation and boundaries.

## Extended Backlog (implementation status)

> Legend: ✅ automated & passing ｜ ⚠️ automated xfail (backend defect) ｜ ⬜ not automated (backend gap).
> As of Run #005, all extended scenarios below are automated except where noted.

### Module A: Booking

| ID | Scenario | Expected | Status |
|---|---|---|---|
| TC-BK-01 | Single-slot pay success | UI confirmed + `bookings.status=confirmed` + `payments.status=succeeded` | ✅ |
| TC-BK-02 | Pay failure | DB payment failed + booking not confirmed | ✅ |
| TC-BK-03 | Bad webhook signature | webhook 400 + booking not confirmed | ✅ |
| TC-BK-04 | Multi-slot checkout | After pay, every booking in group confirmed | ✅ |
| TC-BK-05 | Pay-fail UI copy | UI shows payment-failed (DB covered by TC-BK-02) | ✅ |
| TC-BK-06 | Confirmation before webhook | processing/pending until poll → confirmed | ✅ |
| TC-BK-07 | Taken slot | Occupied slot absent from list (Phase 0.1) | ✅ |
| TC-BK-08 | Two customers, same slot (pre-pay) | A pending; B blocked before pay | ✅ |
| TC-BK-09 | Both reach pay (concurrent confirm) | A confirmed; B cancelled after B's webhook | ✅ |
| TC-BK-10 | Pay after hold expiry | webhook succeeds but booking cancelled; payment succeeded | ✅ |
| TC-BK-11 | Form validation | missing service/slot, name/email/phone, email format, past date, non-30-min duration | ✅ |
| TC-BK-12 | Availability edges | closed day, blocked overlap, open/close boundary slots | ✅ |

### Module D: Reschedule

| ID | Scenario | Expected | Status |
|---|---|---|---|
| TC-RS-01 | Request + admin approve | DB request `status=approved` | ✅ |
| TC-RS-02 | Manage page + submit | One pending request in DB | ✅ |
| TC-RS-03 | Invalid/unknown manage token | Load error, no form | ✅ |
| TC-RS-04 | cancelled/completed/no-show/arrived | Cannot submit reschedule | ✅ |
| TC-RS-05 | Second pending on same booking | existing-pending conflict | ✅ |
| TC-RS-06 | Target slot becomes unavailable | Rejected, no new pending | ✅ |
| TC-RS-07 | Admin UI approve | admin UI / manage UI / DB dates align | ✅ |
| TC-RS-08 | Admin reject | request rejected; DB dates unchanged | ✅ |
| TC-RS-09 | Re-review already reviewed | Error; dates unchanged | ✅ |
| TC-RS-10 | Concurrent admin review | Exactly one wins; other already-reviewed (backend unlocked read → xfail, run-005 §4) | ⚠️ |
| TC-RS-11 | Multiple pending (seeded) | Approving one rejects other pending on same booking | ✅ |

### Module B: Product Order

| ID | Scenario | Expected | Status |
|---|---|---|---|
| TC-OD-01 | White Magic pay success | UI + `product_orders.status=paid` | ✅ |
| TC-OD-02 | Per-product success | White Magic / Love Spell / Money Spell (parameterized) | ✅ |
| TC-OD-03 | Unknown product | "Product not found", no DB row | ✅ |
| TC-OD-04 | Immediate Stripe failure | Order stays pending; confirmation processing | ✅ |
| TC-OD-05 | Product pay failure handling | No `failed` status by design: fail/no webhook → pending + processing UI (Phase 0.4) | ✅ |
| TC-OD-06 | Form validation | required name/email; optional phone/intention; bad email format | ✅ |

### Module C: Admin

| ID | Scenario | Expected | Status |
|---|---|---|---|
| TC-AD-01 | Login success | dashboard + token stored | ✅ |
| TC-AD-02 | Login failure | stay on login + "Invalid credentials" | ✅ |
| TC-AD-03 | No token on admin route | redirect `/admin/login` | ✅ |
| TC-AD-04 | Expired access + valid refresh | auto refresh, stay on bookings | ✅ |
| TC-AD-05 | Invalid refresh | clear tokens + redirect login | ✅ |
| TC-AD-06 | Dual admin tabs logout | A logs out → B action → B redirected on 401 | ✅ |
| TC-AD-07 | Booking list filters | status + email search hit/exclude | ✅ |
| TC-AD-08 | Booking detail | customer/service/time/payment/manage token/requests | ✅ |
| TC-AD-09 | Admin manual reschedule | duration check; success updates DB; mismatch rejected | ✅ |
| TC-AD-10 | Availability management | day toggle, hours, create/delete blocks; public slots reflect | ✅ |
| TC-AD-11 | Availability negatives | block end<start (400), delete missing block (404) covered; business-hours start>end **not validated** by backend — known gap, not automated | ⬜ |

> As of Run #005, the backlog above is fully automated except two backend-related gaps:
> - **TC-RS-10 (⚠️ xfail)**: `ApproveRescheduleRequestAsync` uses unlocked `SELECT`; concurrent approves both succeed. Assertion kept; `@fail` until backend adds locking.
> - **TC-AD-11 (⬜ partial)**: business-hours `start > end` not validated (Phase 0.4); sub-case not automated. Other negatives (block end<start, delete missing block) are covered.
