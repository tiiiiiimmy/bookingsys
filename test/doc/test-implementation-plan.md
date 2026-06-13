# Frontend E2E + BDD Test Suite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a Playwright + Gherkin (playwright-bdd) E2E suite in TypeScript that drives the React frontend against a real .NET backend on an isolated `app_test` MySQL database, mocking Stripe via forged webhooks, and verifies critical flows at UI + API + DB levels.

**Architecture:** All test code lives under `test/`. A global setup migrates/seeds `app_test` and waits for backend+frontend readiness. Page objects expose elements via `data-testid`. Stripe confirmation is simulated by POSTing a self-signed webhook to `/api/webhooks/stripe` (we own `STRIPE_WEBHOOK_SECRET` in the test env). DB assertions use a `mysql2` client.

**Tech Stack:** `@playwright/test`, `playwright-bdd`, `mysql2`, `dotenv`, TypeScript. Backend: .NET 10 + MySQL 8 (unchanged).

**Reference facts (verified against the codebase):**
- Backend DB selection: env var `DB_NAME` (default `bookingsys`); also `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`. Loaded from `backend/.env` via `EnvLoader`.
- Migrate/seed: `dotnet run --project BookingSystem.Api.csproj -- --migrate` and `-- --seed` (seed creates admin `admin@massage.com`/`admin123`, service types, business hours).
- Booking create: `POST /api/bookings` → returns a payment intent incl. `clientSecret` (PaymentIntent id = `clientSecret.split('_secret')[0]`). A `payments` row is inserted with `stripe_payment_intent_id` = that id, status `pending`.
- Webhook: `POST /api/webhooks/stripe`, header `Stripe-Signature: t=<ts>,v1=<hmacSha256(`${ts}.${rawBody}`, STRIPE_WEBHOOK_SECRET)>`. Handled event types: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`. Handler reads `data.object.id` and matches `payments.stripe_payment_intent_id`, then flips the payment to `succeeded`/`failed` and the booking to `confirmed`.
- Frontend service calls: `bookingService` → `GET /bookings/service-types`, `POST /bookings`; `availabilityService` → `GET /availability/business-hours`; `adminService` → `POST /admin/auth/login`, `GET /admin/bookings`; `productOrderService` → `POST /product-orders`.
- Frontend routes: `/booking`, `/booking/confirmation/:bookingId`, `/booking/manage/:token`, `/order`, `/admin/login`, `/admin/bookings`.

---

## File structure

```
test/
  package.json              # test deps + scripts (standalone from frontend)
  tsconfig.json
  playwright.config.ts
  .env.test                 # test DB + Stripe test keys (gitignored)
  .env.test.example         # committed template
  doc/                      # design + this plan (already exists)
  support/
    env.ts                  # typed env access
    db.ts                   # mysql2 pool + query/cleanup helpers
    stripe-mock.ts          # forge + POST signed Stripe webhooks
    backend.ts              # run --migrate/--seed; readiness wait
    global-setup.ts         # orchestrates setup before the run
    fixtures.ts             # playwright-bdd test object + custom fixtures
  pages/
    BookingPage.ts
    BookingConfirmationPage.ts
    AdminLoginPage.ts
    AdminBookingsPage.ts
    ManageBookingPage.ts
    ProductOrderPage.ts
  features/
    booking/book-massage.feature
    booking/reschedule.feature
    order/product-order.feature
    admin/login.feature
    admin/manage-bookings.feature
  steps/
    common.steps.ts
    booking.steps.ts
    order.steps.ts
    admin.steps.ts
```

**Note on TDD for an E2E suite:** the test *is* the artifact. The adapted red→green loop: write the `.feature` + steps (RED — fails because infra/`data-testid`/page object missing), build the minimal infra/selectors to make it pass (GREEN), commit. Infra tasks (1–7) are verified by a smoke run rather than a unit assertion.

---

## Task 1: Scaffold the test project

**Files:**
- Create: `test/package.json`
- Create: `test/tsconfig.json`
- Create: `test/.env.test.example`
- Create: `test/.gitignore`
- Modify: `.gitignore` (repo root) — ignore `test/.env.test`

- [ ] **Step 1: Create `test/package.json`**

```json
{
  "name": "bookingsys-e2e",
  "private": true,
  "type": "module",
  "scripts": {
    "test:e2e": "bddgen && playwright test",
    "test:e2e:ui": "bddgen && playwright test --ui",
    "test:report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "playwright-bdd": "^8.0.0",
    "mysql2": "^3.11.0",
    "dotenv": "^16.4.0",
    "typescript": "^5.6.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Create `test/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"],
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 3: Create `test/.env.test.example`**

```bash
# Frontend / backend base URLs
BASE_URL=http://localhost:3000
API_URL=http://localhost:5000/api

# Isolated test database (NEVER point this at production)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=app_test
DB_USER=root
DB_PASSWORD=changeme

# Stripe TEST-mode keys (sk_test_/pk_test_). Webhook secret is ours to choose.
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_test_local_secret

# Path to the .NET backend project (relative to repo root)
BACKEND_DIR=../backend
```

- [ ] **Step 4: Create `test/.gitignore`**

```
.env.test
node_modules/
test-results/
playwright-report/
.features-gen/
```

- [ ] **Step 5: Add to repo-root `.gitignore`**

Append the line `test/.env.test` to `/Users/ss/Desktop/hotb/bookingsys/bookingsys/.gitignore`.

- [ ] **Step 6: Install dependencies**

Run: `cd test && npm install && npx playwright install chromium`
Expected: dependencies installed, Chromium downloaded.

- [ ] **Step 7: Commit**

```bash
git add test/package.json test/tsconfig.json test/.env.test.example test/.gitignore .gitignore
git commit -m "chore(test): scaffold playwright-bdd e2e project"
```

---

## Task 2: Typed environment access (`support/env.ts`)

**Files:**
- Create: `test/support/env.ts`

- [ ] **Step 1: Implement `env.ts`**

```ts
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(dir, '../.env.test') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} in test/.env.test`);
  return value;
}

export const env = {
  baseUrl: process.env.BASE_URL ?? 'http://localhost:3000',
  apiUrl: process.env.API_URL ?? 'http://localhost:5000/api',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? '3306'),
    database: required('DB_NAME'),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
  },
  stripe: {
    webhookSecret: required('STRIPE_WEBHOOK_SECRET'),
  },
  backendDir: process.env.BACKEND_DIR ?? '../backend',
};

// Hard safety guard: refuse to run against a non-test database.
if (!/test/i.test(env.db.database)) {
  throw new Error(`Refusing to run: DB_NAME="${env.db.database}" does not look like a test DB.`);
}
```

- [ ] **Step 2: Commit**

```bash
git add test/support/env.ts
git commit -m "feat(test): typed env access with test-db safety guard"
```

---

## Task 3: Database helper (`support/db.ts`)

**Files:**
- Create: `test/support/db.ts`

- [ ] **Step 1: Implement `db.ts`**

```ts
import mysql from 'mysql2/promise';
import { env } from './env.js';

let pool: mysql.Pool | undefined;

export function db(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      database: env.db.database,
      user: env.db.user,
      password: env.db.password,
      connectionLimit: 5,
    });
  }
  return pool;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const [rows] = await db().query(sql, params);
  return (rows as T[])[0];
}

/** Latest booking for a customer email, joined with its payment status. */
export async function getBookingByEmail(email: string) {
  return queryOne<{ id: number; status: string; payment_status: string | null }>(
    `SELECT b.id, b.status, p.status AS payment_status
       FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       LEFT JOIN payments p ON p.booking_id = b.id
      WHERE c.email = ?
      ORDER BY b.id DESC
      LIMIT 1`,
    [email],
  );
}

/** Remove all data created by a test customer email (cascade-safe order). */
export async function cleanupCustomer(email: string): Promise<void> {
  const customer = await queryOne<{ id: number }>('SELECT id FROM customers WHERE email = ?', [email]);
  if (!customer) return;
  await db().query(
    'DELETE p FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE b.customer_id = ?',
    [customer.id],
  );
  await db().query('DELETE FROM booking_reschedule_requests WHERE booking_id IN (SELECT id FROM bookings WHERE customer_id = ?)', [customer.id]);
  await db().query('DELETE FROM bookings WHERE customer_id = ?', [customer.id]);
  await db().query('DELETE FROM customers WHERE id = ?', [customer.id]);
}
```

- [ ] **Step 2: Verify column names against the live schema**

Run: `cd test && node --input-type=module -e "import('./support/db.js').then(async m => { console.log(await m.getBookingByEmail('admin@massage.com')); await m.closeDb(); })"`
Expected: runs without SQL error (returns `undefined` if no such booking). If a column name differs, fix the SQL in Step 1 to match the actual `bookings`/`customers`/`payments` schema (inspect via `backend/Database`).

- [ ] **Step 3: Commit**

```bash
git add test/support/db.ts
git commit -m "feat(test): mysql2 db helper for state assertions and cleanup"
```

---

## Task 4: Stripe webhook mock (`support/stripe-mock.ts`)

**Files:**
- Create: `test/support/stripe-mock.ts`

- [ ] **Step 1: Implement `stripe-mock.ts`**

```ts
import crypto from 'node:crypto';
import { env } from './env.js';

type Outcome = 'succeeded' | 'failed';

/** Derive the PaymentIntent id from a Stripe client secret (`pi_x_secret_y` -> `pi_x`). */
export function paymentIntentIdFromClientSecret(clientSecret: string): string {
  return clientSecret.split('_secret')[0];
}

function sign(rawBody: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const hmac = crypto
    .createHmac('sha256', env.stripe.webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

/**
 * Forge and POST a Stripe webhook to the backend, deterministically driving
 * a payment to `succeeded` or `failed`. We own STRIPE_WEBHOOK_SECRET in the
 * test env, so the signature verifies.
 */
export async function sendPaymentWebhook(paymentIntentId: string, outcome: Outcome): Promise<void> {
  const type = outcome === 'succeeded' ? 'payment_intent.succeeded' : 'payment_intent.payment_failed';
  const event = {
    id: `evt_test_${Date.now()}`,
    type,
    data: {
      object: {
        id: paymentIntentId,
        object: 'payment_intent',
        latest_charge: `ch_test_${Date.now()}`,
      },
    },
  };
  const rawBody = JSON.stringify(event);
  const res = await fetch(`${env.apiUrl}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': sign(rawBody) },
    body: rawBody,
  });
  if (!res.ok) throw new Error(`Webhook POST failed: ${res.status} ${await res.text()}`);
}

/** Forge a webhook with a deliberately invalid signature (exception scenario). */
export async function sendUnsignedWebhook(paymentIntentId: string): Promise<number> {
  const rawBody = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: paymentIntentId } } });
  const res = await fetch(`${env.apiUrl}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 't=1,v1=deadbeef' },
    body: rawBody,
  });
  return res.status; // expected 400
}
```

- [ ] **Step 2: Commit**

```bash
git add test/support/stripe-mock.ts
git commit -m "feat(test): forge signed Stripe webhooks for deterministic payment outcomes"
```

---

## Task 5: Backend lifecycle + global setup (`support/backend.ts`, `support/global-setup.ts`)

**Files:**
- Create: `test/support/backend.ts`
- Create: `test/support/global-setup.ts`

- [ ] **Step 1: Implement `backend.ts`**

```ts
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(dir, '..', env.backendDir);

/** Run a one-shot `dotnet run -- <arg>` against the test DB and wait for exit. */
export function runBackendCommand(arg: '--migrate' | '--seed'): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('dotnet', ['run', '--project', 'BookingSystem.Api.csproj', '--', arg], {
      cwd: backendDir,
      env: { ...process.env, DB_NAME: env.db.database },
      stdio: 'inherit',
    });
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${arg} exited ${code}`))));
  });
}

/** Poll a URL until it responds or the timeout elapses. */
export async function waitForUrl(url: string, timeoutMs = 60_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
```

- [ ] **Step 2: Implement `global-setup.ts`**

```ts
import { runBackendCommand, waitForUrl } from './backend.js';
import { env } from './env.js';
import { closeDb } from './db.js';

/**
 * Runs once before the suite: migrate + seed the isolated app_test DB, then
 * verify the backend and frontend are reachable. The backend and frontend dev
 * servers themselves are started by playwright.config webServer entries.
 */
export default async function globalSetup() {
  await runBackendCommand('--migrate');
  await runBackendCommand('--seed');
  await waitForUrl(`${env.apiUrl}/bookings/service-types`);
  await waitForUrl(env.baseUrl);
  await closeDb();
}
```

- [ ] **Step 3: Commit**

```bash
git add test/support/backend.ts test/support/global-setup.ts
git commit -m "feat(test): migrate+seed app_test and readiness checks in global setup"
```

---

## Task 6: Playwright config (`playwright.config.ts`)

**Files:**
- Create: `test/playwright.config.ts`

- [ ] **Step 1: Implement `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { env } from './support/env.js';

const testDir = defineBddConfig({
  features: ['features/**/*.feature'],
  steps: ['steps/**/*.ts', 'support/fixtures.ts'],
});

export default defineConfig({
  testDir,
  globalSetup: './support/global-setup.ts',
  timeout: 60_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'dotnet run --project BookingSystem.Api.csproj',
      cwd: env.backendDir,
      env: { DB_NAME: env.db.database },
      url: `${env.apiUrl}/bookings/service-types`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: '../frontend',
      url: env.baseUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
```

- [ ] **Step 2: Verify config loads**

Run: `cd test && npx bddgen`
Expected: completes with no features yet (or "0 features"), no config error.

- [ ] **Step 3: Commit**

```bash
git add test/playwright.config.ts
git commit -m "feat(test): playwright-bdd config with backend+frontend webServers"
```

---

## Task 7: BDD fixtures (`support/fixtures.ts`)

**Files:**
- Create: `test/support/fixtures.ts`

- [ ] **Step 1: Implement `fixtures.ts`**

```ts
import { test as base, createBdd } from 'playwright-bdd';
import { BookingPage } from '../pages/BookingPage.js';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage.js';
import { AdminLoginPage } from '../pages/AdminLoginPage.js';
import { AdminBookingsPage } from '../pages/AdminBookingsPage.js';

type Fixtures = {
  bookingPage: BookingPage;
  confirmationPage: BookingConfirmationPage;
  adminLoginPage: AdminLoginPage;
  adminBookingsPage: AdminBookingsPage;
  /** Per-scenario unique customer email for data isolation. */
  customerEmail: string;
};

export const test = base.extend<Fixtures>({
  bookingPage: async ({ page }, use) => use(new BookingPage(page)),
  confirmationPage: async ({ page }, use) => use(new BookingConfirmationPage(page)),
  adminLoginPage: async ({ page }, use) => use(new AdminLoginPage(page)),
  adminBookingsPage: async ({ page }, use) => use(new AdminBookingsPage(page)),
  customerEmail: async ({}, use) => use(`cust+${Date.now()}@test.local`),
});

export const { Given, When, Then } = createBdd(test);
```

- [ ] **Step 2: Commit**

```bash
git add test/support/fixtures.ts
git commit -m "feat(test): bdd fixtures with page objects and per-scenario unique email"
```

---

## Task 8: Add `data-testid` to the booking flow

**Files:**
- Modify: `frontend/src/pages/BookingPage.jsx`
- Modify: `frontend/src/pages/BookingConfirmationPage.jsx`
- (Inspect first; components under `frontend/src/components/public` may hold the actual form fields.)

- [ ] **Step 1: Inspect the booking JSX to locate the real elements**

Run: `cd frontend && grep -rnE "service|slot|firstName|email|submit|button|status" src/pages/BookingPage.jsx src/pages/BookingConfirmationPage.jsx src/components/public`
Expected: identifies the elements that need ids.

- [ ] **Step 2: Add the following `data-testid` attributes**

Apply this naming (kebab-case `area-element[-modifier]`). Add each to the corresponding JSX element:

| Element | `data-testid` |
| --- | --- |
| Service-type option (each) | `booking-service-option` |
| Available time-slot item (each) | `booking-slot-item` |
| Customer first-name input | `booking-first-name` |
| Customer last-name input | `booking-last-name` |
| Customer email input | `booking-email` |
| Customer phone input | `booking-phone` |
| Submit / proceed-to-payment button | `booking-submit` |
| Confirmation status badge | `booking-status-badge` |

Example edit pattern (apply to the real element in the file):

```jsx
<button className="..." onClick={handleSubmit} data-testid="booking-submit">
  Proceed to payment
</button>
```

- [ ] **Step 3: Verify the app still builds**

Run: `cd frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/BookingPage.jsx frontend/src/pages/BookingConfirmationPage.jsx frontend/src/components/public
git commit -m "test(frontend): add data-testid to booking flow elements"
```

---

## Task 9: Booking page objects

**Files:**
- Create: `test/pages/BookingPage.ts`
- Create: `test/pages/BookingConfirmationPage.ts`

- [ ] **Step 1: Implement `BookingPage.ts`**

```ts
import { Page, expect } from '@playwright/test';

export class BookingPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/booking');
  }

  async selectFirstService() {
    await this.page.getByTestId('booking-service-option').first().click();
  }

  async selectFirstSlot() {
    await this.page.getByTestId('booking-slot-item').first().click();
  }

  async fillCustomer(email: string) {
    await this.page.getByTestId('booking-first-name').fill('Test');
    await this.page.getByTestId('booking-last-name').fill('Customer');
    await this.page.getByTestId('booking-email').fill(email);
    await this.page.getByTestId('booking-phone').fill('0211234567');
  }

  /** Submits the booking and returns the clientSecret from the POST /bookings response. */
  async submitAndCaptureClientSecret(): Promise<string> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/bookings') && r.request().method() === 'POST'),
      this.page.getByTestId('booking-submit').click(),
    ]);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const clientSecret = body?.data?.clientSecret ?? body?.clientSecret;
    expect(clientSecret, 'clientSecret in POST /bookings response').toBeTruthy();
    return clientSecret;
  }
}
```

- [ ] **Step 2: Implement `BookingConfirmationPage.ts`**

```ts
import { Page, expect } from '@playwright/test';

export class BookingConfirmationPage {
  constructor(private page: Page) {}

  async expectStatus(expected: string) {
    await expect(this.page.getByTestId('booking-status-badge')).toContainText(expected, { timeout: 15_000 });
  }
}
```

- [ ] **Step 3: Adjust response shape if needed**

Run: `cd frontend && grep -rnE "clientSecret|data\.|\.data" src/services/bookingService.js src/pages/BookingPage.jsx`
Expected: confirm whether the API envelope is `{ data: { clientSecret } }` or flat; the page object already tries both, but tighten if necessary.

- [ ] **Step 4: Commit**

```bash
git add test/pages/BookingPage.ts test/pages/BookingConfirmationPage.ts
git commit -m "feat(test): booking page objects"
```

---

## Task 10: Booking — happy path (reference vertical)

**Files:**
- Create: `test/features/booking/book-massage.feature`
- Create: `test/steps/booking.steps.ts`
- Create: `test/steps/common.steps.ts`

- [ ] **Step 1: Write the failing feature `book-massage.feature`**

```gherkin
Feature: Book a massage
  As a customer I want to book and pay for a massage
  so that my appointment is confirmed.

  Scenario: Customer books an available slot and payment succeeds
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And the payment succeeds
    Then I see the booking confirmed
    And the booking is confirmed in the database

  Scenario: Payment fails and the booking is not confirmed
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And the payment fails
    Then the booking is not confirmed in the database
```

- [ ] **Step 2: Write `common.steps.ts` (cleanup hook)**

```ts
import { After } from 'playwright-bdd';
import { test } from '../support/fixtures.js';
import { cleanupCustomer, closeDb } from '../support/db.js';

// Per-scenario teardown: remove the unique customer this scenario created.
test.afterEach(async ({ customerEmail }) => {
  await cleanupCustomer(customerEmail);
});

test.afterAll(async () => {
  await closeDb();
});
```

- [ ] **Step 3: Write `booking.steps.ts`**

```ts
import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { sendPaymentWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import { getBookingByEmail } from '../support/db.js';

let clientSecret = '';

Given('I am on the booking page', async ({ bookingPage }) => {
  await bookingPage.open();
});

When('I select the first available service and slot', async ({ bookingPage }) => {
  await bookingPage.selectFirstService();
  await bookingPage.selectFirstSlot();
});

When('I enter my customer details', async ({ bookingPage, customerEmail }) => {
  await bookingPage.fillCustomer(customerEmail);
});

When('I submit the booking', async ({ bookingPage }) => {
  clientSecret = await bookingPage.submitAndCaptureClientSecret();
});

When('the payment succeeds', async () => {
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(clientSecret), 'succeeded');
});

When('the payment fails', async () => {
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(clientSecret), 'failed');
});

Then('I see the booking confirmed', async ({ confirmationPage }) => {
  await confirmationPage.expectStatus('confirmed');
});

Then('the booking is confirmed in the database', async ({ customerEmail }) => {
  await expect.poll(async () => (await getBookingByEmail(customerEmail))?.status, { timeout: 10_000 })
    .toBe('confirmed');
});

Then('the booking is not confirmed in the database', async ({ customerEmail }) => {
  const booking = await getBookingByEmail(customerEmail);
  expect(booking?.status).not.toBe('confirmed');
});
```

- [ ] **Step 4: Run and verify it fails for the right reason first**

Run: `cd test && npm run test:e2e -- features/booking/book-massage.feature`
Expected initially: RED — failures should be about app behavior/selectors (e.g. a missing `data-testid` or a navigation assertion), NOT config/import errors. Fix any infra/selector gap revealed (e.g. an unmatched `data-testid` from Task 8, or the confirmation route flow), then re-run.

- [ ] **Step 5: Run until green**

Run: `cd test && npm run test:e2e -- features/booking/book-massage.feature`
Expected: PASS (2 scenarios). On failure, open the trace: `npm run test:report`.

- [ ] **Step 6: Commit**

```bash
git add test/features/booking test/steps/booking.steps.ts test/steps/common.steps.ts
git commit -m "test(e2e): booking happy path + payment failure scenarios"
```

---

## Task 11: Admin login

**Files:**
- Create: `test/pages/AdminLoginPage.ts`
- Create: `test/pages/AdminBookingsPage.ts`
- Create: `test/features/admin/login.feature`
- Create: `test/steps/admin.steps.ts`
- Modify: `frontend/src/pages/admin/LoginPage.jsx` (add `data-testid`)

- [ ] **Step 1: Add `data-testid` to the admin login form**

In `frontend/src/pages/admin/LoginPage.jsx`: email input → `admin-login-email`, password input → `admin-login-password`, submit button → `admin-login-submit`, error message → `admin-login-error`.

- [ ] **Step 2: Implement `AdminLoginPage.ts`**

```ts
import { Page } from '@playwright/test';

export class AdminLoginPage {
  constructor(private page: Page) {}
  async open() { await this.page.goto('/admin/login'); }
  async login(email: string, password: string) {
    await this.page.getByTestId('admin-login-email').fill(email);
    await this.page.getByTestId('admin-login-password').fill(password);
    await this.page.getByTestId('admin-login-submit').click();
  }
}
```

- [ ] **Step 3: Implement `AdminBookingsPage.ts`**

```ts
import { Page, expect } from '@playwright/test';

export class AdminBookingsPage {
  constructor(private page: Page) {}
  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/admin\/bookings/);
  }
}
```

- [ ] **Step 4: Write `login.feature`**

```gherkin
Feature: Admin login
  Scenario: Admin signs in with valid credentials
    Given I am on the admin login page
    When I sign in as the seeded admin
    Then I land on the admin bookings page

  Scenario: Admin sign-in fails with wrong password
    Given I am on the admin login page
    When I sign in with email "admin@massage.com" and password "wrong-password"
    Then I see an admin login error
```

- [ ] **Step 5: Write `admin.steps.ts`**

```ts
import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';

Given('I am on the admin login page', async ({ adminLoginPage }) => {
  await adminLoginPage.open();
});

When('I sign in as the seeded admin', async ({ adminLoginPage, page }) => {
  await adminLoginPage.login('admin@massage.com', 'admin123');
  await page.goto('/admin/bookings');
});

When('I sign in with email {string} and password {string}', async ({ adminLoginPage }, email: string, password: string) => {
  await adminLoginPage.login(email, password);
});

Then('I land on the admin bookings page', async ({ adminBookingsPage }) => {
  await adminBookingsPage.expectLoaded();
});

Then('I see an admin login error', async ({ page }) => {
  await expect(page.getByTestId('admin-login-error')).toBeVisible();
});
```

- [ ] **Step 6: Run until green**

Run: `cd test && npm run test:e2e -- features/admin/login.feature`
Expected: PASS (2 scenarios).

- [ ] **Step 7: Commit**

```bash
git add test/pages/AdminLoginPage.ts test/pages/AdminBookingsPage.ts test/features/admin/login.feature test/steps/admin.steps.ts frontend/src/pages/admin/LoginPage.jsx
git commit -m "test(e2e): admin login success and failure scenarios"
```

---

## Task 12: Product order flow

**Files:**
- Create: `test/pages/ProductOrderPage.ts`
- Create: `test/features/order/product-order.feature`
- Create: `test/steps/order.steps.ts`
- Modify: `frontend/src/pages/ProductOrderPage.jsx`, `frontend/src/pages/ProductOrderConfirmationPage.jsx` (add `data-testid`)

- [ ] **Step 1: Inspect the order flow**

Run: `cd frontend && grep -rnE "product|order|quantity|submit|status|email" src/pages/ProductOrderPage.jsx src/pages/ProductOrderConfirmationPage.jsx src/services/productOrderService.js`
Expected: locate the product selection, customer fields, submit button, and confirmation status element.

- [ ] **Step 2: Add `data-testid`**

`product-card` (each product), `order-email` (customer email), `order-submit` (place-order/pay button), `order-status-badge` (confirmation status).

- [ ] **Step 3: Implement `ProductOrderPage.ts`**

```ts
import { Page, expect } from '@playwright/test';

export class ProductOrderPage {
  constructor(private page: Page) {}
  async open() { await this.page.goto('/order'); }
  async selectFirstProduct() { await this.page.getByTestId('product-card').first().click(); }
  async fillCustomer(email: string) { await this.page.getByTestId('order-email').fill(email); }

  async submitAndCaptureClientSecret(): Promise<string> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/product-orders') && r.request().method() === 'POST'),
      this.page.getByTestId('order-submit').click(),
    ]);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const clientSecret = body?.data?.clientSecret ?? body?.clientSecret;
    expect(clientSecret).toBeTruthy();
    return clientSecret;
  }

  async expectStatus(expected: string) {
    await expect(this.page.getByTestId('order-status-badge')).toContainText(expected, { timeout: 15_000 });
  }
}
```

- [ ] **Step 4: Write `product-order.feature`**

```gherkin
Feature: Place a product order
  Scenario: Customer orders a product and payment succeeds
    Given I am on the product order page
    When I select the first product
    And I enter my order email
    And I submit the order
    And the order payment succeeds
    Then I see the order confirmed
```

- [ ] **Step 5: Write `order.steps.ts`**

```ts
import { Given, When, Then } from '../support/fixtures.js';
import { ProductOrderPage } from '../pages/ProductOrderPage.js';
import { sendPaymentWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';

let orderPage: ProductOrderPage;
let clientSecret = '';

Given('I am on the product order page', async ({ page }) => {
  orderPage = new ProductOrderPage(page);
  await orderPage.open();
});

When('I select the first product', async () => { await orderPage.selectFirstProduct(); });
When('I enter my order email', async ({ customerEmail }) => { await orderPage.fillCustomer(customerEmail); });
When('I submit the order', async () => { clientSecret = await orderPage.submitAndCaptureClientSecret(); });
When('the order payment succeeds', async () => {
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(clientSecret), 'succeeded');
});
Then('I see the order confirmed', async () => { await orderPage.expectStatus('confirmed'); });
```

- [ ] **Step 6: Add product-order cleanup**

In `test/support/db.ts`, add a `cleanupProductOrder(email)` helper that deletes from `product_orders` (and its payments) by customer email; call it in the `afterEach` in `common.steps.ts`. Inspect the `product_orders` schema first via `backend/Database` to use correct column names.

- [ ] **Step 7: Run until green**

Run: `cd test && npm run test:e2e -- features/order/product-order.feature`
Expected: PASS (1 scenario).

- [ ] **Step 8: Commit**

```bash
git add test/pages/ProductOrderPage.ts test/features/order test/steps/order.steps.ts test/support/db.ts frontend/src/pages/ProductOrderPage.jsx frontend/src/pages/ProductOrderConfirmationPage.jsx
git commit -m "test(e2e): product order happy path"
```

---

## Task 13: Reschedule flow

**Files:**
- Create: `test/pages/ManageBookingPage.ts`
- Create: `test/features/booking/reschedule.feature`
- Add steps to `test/steps/booking.steps.ts`
- Modify: `frontend/src/pages/ManageBookingPage.jsx`, `frontend/src/components/admin/*` (add `data-testid` for the manage form + admin approve/reject buttons)

- [ ] **Step 1: Inspect the reschedule + admin approval UI**

Run: `cd frontend && grep -rnE "reschedule|manage|approve|reject|token|requested" src/pages/ManageBookingPage.jsx src/components/admin`
Expected: locate the reschedule request form and the admin approve/reject controls.

- [ ] **Step 2: Add `data-testid`**

Manage page: `manage-reschedule-date`, `manage-reschedule-submit`, `manage-reschedule-result`. Admin bookings: `admin-reschedule-approve`, `admin-reschedule-reject` (per pending request row).

- [ ] **Step 3: Implement `ManageBookingPage.ts`**

```ts
import { Page, expect } from '@playwright/test';

export class ManageBookingPage {
  constructor(private page: Page) {}
  async open(token: string) { await this.page.goto(`/booking/manage/${token}`); }
  async requestReschedule(isoDate: string) {
    await this.page.getByTestId('manage-reschedule-date').fill(isoDate);
    await this.page.getByTestId('manage-reschedule-submit').click();
    await expect(this.page.getByTestId('manage-reschedule-result')).toBeVisible();
  }
}
```

- [ ] **Step 4: Write `reschedule.feature`**

```gherkin
Feature: Reschedule a booking
  Scenario: Customer requests a reschedule and admin approves it
    Given a confirmed booking exists with a manage token
    When the customer requests a new date via the manage link
    And the admin approves the reschedule request
    Then the booking reflects the new date in the database
```

- [ ] **Step 5: Add the reschedule steps to `booking.steps.ts`**

Build on the existing helpers. The "confirmed booking with a manage token" precondition reuses the booking-create + `sendPaymentWebhook('succeeded')` flow, then reads the manage token from the DB. Add to `db.ts` a `getManageToken(email)` helper:

```ts
// in db.ts
export async function getManageToken(email: string) {
  return queryOne<{ manage_token: string }>(
    `SELECT b.manage_token FROM bookings b JOIN customers c ON c.id = b.customer_id
      WHERE c.email = ? ORDER BY b.id DESC LIMIT 1`,
    [email],
  );
}
```

```ts
// in booking.steps.ts
import { ManageBookingPage } from '../pages/ManageBookingPage.js';
import { getManageToken, getBookingByEmail } from '../support/db.js';
import { expect } from '@playwright/test';

let rescheduleDate = '';

Given('a confirmed booking exists with a manage token', async ({ bookingPage, customerEmail, page }) => {
  await bookingPage.open();
  await bookingPage.selectFirstService();
  await bookingPage.selectFirstSlot();
  await bookingPage.fillCustomer(customerEmail);
  const secret = await bookingPage.submitAndCaptureClientSecret();
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(secret), 'succeeded');
  await expect.poll(async () => (await getBookingByEmail(customerEmail))?.status).toBe('confirmed');
});

When('the customer requests a new date via the manage link', async ({ page, customerEmail }) => {
  const token = (await getManageToken(customerEmail))!.manage_token;
  rescheduleDate = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const manage = new ManageBookingPage(page);
  await manage.open(token);
  await manage.requestReschedule(rescheduleDate);
});
```

The admin-approve step and DB assertion use the admin bookings UI (`admin-reschedule-approve`) after logging in via `AdminLoginPage`, then verify the booking's new date via a `db.ts` query. Confirm the exact `bookings` date column and `booking_reschedule_requests` columns against `backend/Database` and finalize the approve step + assertion accordingly.

- [ ] **Step 6: Run until green**

Run: `cd test && npm run test:e2e -- features/booking/reschedule.feature`
Expected: PASS (1 scenario).

- [ ] **Step 7: Commit**

```bash
git add test/pages/ManageBookingPage.ts test/features/booking/reschedule.feature test/steps/booking.steps.ts test/support/db.ts frontend/src/pages/ManageBookingPage.jsx frontend/src/components/admin
git commit -m "test(e2e): reschedule request + admin approval flow"
```

---

## Task 14: Exception scenario + full-suite run + docs

**Files:**
- Modify: `test/features/booking/book-massage.feature` (add invalid-signature scenario)
- Modify: `test/steps/booking.steps.ts`
- Create: `test/doc/test-plan.md`
- Modify: `README.md` (add an E2E section)

- [ ] **Step 1: Add the webhook exception scenario**

Append to `book-massage.feature`:

```gherkin
  Scenario: A webhook with an invalid signature is rejected
    Given I am on the booking page
    When I select the first available service and slot
    And I enter my customer details
    And I submit the booking
    And a webhook with an invalid signature arrives
    Then the booking is not confirmed in the database
```

Add the step (reuses `sendUnsignedWebhook`):

```ts
import { sendUnsignedWebhook } from '../support/stripe-mock.js';
import { expect } from '@playwright/test';

When('a webhook with an invalid signature arrives', async () => {
  const status = await sendUnsignedWebhook(paymentIntentIdFromClientSecret(clientSecret));
  expect(status).toBe(400);
});
```

- [ ] **Step 2: Write `test/doc/test-plan.md`**

Capture: scope (Section 2 of the design), the test pyramid (Playwright-only), environment (app_test, Stripe test keys), data strategy (uniquified + per-scenario cleanup), the scenario matrix (booking happy/fail/exception, admin login ok/fail, product order, reschedule), execution commands, and exit criteria (all scenarios green in CI, traces on failure).

- [ ] **Step 3: Run the entire suite**

Run: `cd test && npm run test:e2e`
Expected: all scenarios PASS. Inspect failures via `npm run test:report`.

- [ ] **Step 4: Add an E2E section to `README.md`**

Document: copy `test/.env.test.example` → `test/.env.test`, set Stripe test keys + `DB_NAME=app_test`, `cd test && npm install && npx playwright install chromium`, then `npm run test:e2e`.

- [ ] **Step 5: Commit**

```bash
git add test/features/booking/book-massage.feature test/steps/booking.steps.ts test/doc/test-plan.md README.md
git commit -m "test(e2e): webhook exception scenario, test plan doc, README e2e guide"
```

---

## Self-review notes

- **Spec coverage:** Playwright-only/no-Jest (Task 1), Gherkin/playwright-bdd (Tasks 6,10+), TypeScript (Task 1), isolated `app_test` + migrate/seed once (Tasks 2,5,6), uniquified data + cleanup (Tasks 7,10,12), DB-state assertions via mysql2 (Tasks 3,10), Stripe/email mocked via forged webhook (Task 4,10,14), `data-testid` everywhere tests touch (Tasks 8,11,12,13), docs under `test/doc` + content under `test/` (all tasks). Scenario backlog from design §9 → Tasks 10–14.
- **Open verification points (resolve during execution, not placeholders):** exact column names in `bookings`/`customers`/`payments`/`product_orders`/`booking_reschedule_requests` (verified in Tasks 3/12/13 steps against `backend/Database`); the POST response envelope shape for `clientSecret` (Task 9 step 3). These are deliberate "inspect-then-confirm" steps because the live schema/DTOs are the source of truth.
- **Email mock:** the design lists email among mocked third-parties. The backend sends mail via `EmailService`; with no SMTP configured in `test/.env.test`, sends are no-ops/fail-soft and are not asserted. If a scenario needs to assert a notification, add a `notifications`/log query to `db.ts` once that table is confirmed. Out of scope for the listed scenarios.
