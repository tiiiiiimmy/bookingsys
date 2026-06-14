import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { env, backendProcessEnv } from './support/env.js';

// Bypass any local HTTP proxy (e.g. Clash on 127.0.0.1:7897) for localhost, so
// Playwright's webServer reachability checks and readiness polling hit the real
// local servers instead of getting a 502 from the proxy.
const noProxy = [process.env.NO_PROXY, 'localhost', '127.0.0.1', '::1'].filter(Boolean).join(',');
process.env.NO_PROXY = noProxy;
process.env.no_proxy = noProxy;

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;

const testDir = defineBddConfig({
  features: ['features/**/*.feature'],
  steps: ['steps/**/*.ts', 'support/fixtures.ts'],
});

export default defineConfig({
  testDir,
  globalSetup: './support/global-setup.ts',
  // Serial execution: scenarios share one test DB and compete for the same
  // booking slots, so they must not run in parallel.
  fullyParallel: false,
  workers: 1,
  // Retry: the booking/reschedule flows occasionally render a blank page on a
  // cold/slow first attempt (JIT + Stripe.js load via the local proxy); retries
  // run clean. The longer flows also need more headroom than 60s.
  retries: 2,
  timeout: 90_000,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: env.baseUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `${shellQuote(env.dotnet.cli)} run --project BookingSystem.Api.csproj`,
      cwd: env.backendDir,
      env: backendProcessEnv(),
      // DB-independent readiness probe: the webServer is started before
      // globalSetup runs migrate+seed, so a DB-backed URL would 500 here.
      url: new URL('/health', env.apiUrl).toString(),
      // Always start our own test-configured backend; never reuse the dev one.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'npm run dev',
      cwd: '../frontend',
      // Frontend already points at the backend via frontend/.env (VITE_API_URL).
      url: env.baseUrl,
      // Reuse the running dev frontend on :3000 if present.
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
