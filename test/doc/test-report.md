# E2E Test Report Index

Each run produces a report with **run number + timestamp** under `test/doc/reports/`. Newest first.

| Run | Time | Result | Report |
|---|---|---|---|
| #005 | 2026-06-15 | ✅ 54 passed / 0 failed / 0 flaky (1 xfail, Phase 5 landed) | [run-005-2026-06-15.md](reports/run-005-2026-06-15.md) |
| #004 | 2026-06-15 | ✅ 45 passed / 0 failed / 0 flaky (1 xfail) | [run-004-2026-06-15.md](reports/run-004-2026-06-15.md) |
| #003 | 2026-06-14 ~15:31 | ✅ 7 passed / 0 failed / 0 flaky | [run-003-2026-06-14.md](reports/run-003-2026-06-14.md) |
| #002 | 2026-06-14 14:03–14:04 | ✅ 7 passed / 0 failed | [run-002-2026-06-14.md](reports/run-002-2026-06-14.md) |
| #001 | 2026-06-14 (pre-fix baseline) | 3 passed / 4 failed | [run-001-2026-06-14.md](reports/run-001-2026-06-14.md) |

## Current Status

Latest run (#005): **all 54 scenarios green, 0 retries** (1 expected xfail for TC-RS-10 backend concurrency defect).
Covers booking (including concurrency & hold expiry), reschedule (TC-RS-01..11), product orders (TC-OD-01..06),
admin login/session/management (TC-AD-01..11) with UI + API + DB assertions. Stripe fully mocked
(`STRIPE_FAKE_PAYMENTS` + forged webhooks; browser blocks `stripe.com`). Known gaps: TC-RS-10 (xfail);
TC-AD-11 business-hours `start>end` sub-case (backend not validated; not automated).

## How to Run

```bash
cd test && npm run test:regression
```

> Stop any dev backend on `:5001` before running (tests start their own backend on `bookingsys_test`). Frontend dev server on `:3000` may be reused.
