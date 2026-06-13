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
