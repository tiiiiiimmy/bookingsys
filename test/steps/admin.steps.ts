import { expect, type Page } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { adminLoginTokens } from '../support/api.js';
import { env } from '../support/env.js';

let originalAccessToken = '';
let firstAdminTab: Page;
let secondAdminTab: Page;
let shouldWaitForRefresh = false;
let refreshStatus = 0;

Given('I am on the admin login page', async ({ adminLoginPage }) => {
  await adminLoginPage.open();
});

Given('I am not authenticated as admin', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  });
});

// Requesting `adminPage` triggers the fixture, which seeds the auth tokens into
// localStorage before the app boots — so no UI login is needed.
Given('I am authenticated as admin', async ({ adminPage }) => {
  void adminPage;
});

Given('I have a valid admin session with an expired access token', async ({ page }) => {
  const tokens = await adminLoginTokens();
  originalAccessToken = tokens.accessToken;
  shouldWaitForRefresh = true;
  refreshStatus = 0;
  await page.goto('/admin/login');
  await page.evaluate((refreshToken) => {
    localStorage.setItem('accessToken', 'expired.e2e.jwt');
    localStorage.setItem('refreshToken', refreshToken);
  }, tokens.refreshToken);
});

Given('I have invalid admin tokens', async ({ page }) => {
  await page.goto('/admin/login');
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'invalid.e2e.jwt');
    localStorage.setItem('refreshToken', 'invalid-refresh-token');
  });
});

Given('I have two authenticated admin tabs', async ({ context }) => {
  const tokens = await adminLoginTokens();
  firstAdminTab = await context.newPage();
  secondAdminTab = await context.newPage();
  await firstAdminTab.goto('/admin/login');
  await firstAdminTab.evaluate(([accessToken, refreshToken]) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }, [tokens.accessToken, tokens.refreshToken]);
  await firstAdminTab.goto('/admin/bookings');
  await secondAdminTab.goto('/admin/bookings');
  await expect(firstAdminTab).toHaveURL(/\/admin\/bookings/);
  await expect(secondAdminTab).toHaveURL(/\/admin\/bookings/);
});

When('I open the admin bookings page', async ({ page }) => {
  if (shouldWaitForRefresh) {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/admin/auth/refresh') && r.request().method() === 'POST'),
      page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' }),
    ]);
    refreshStatus = response.status();
    shouldWaitForRefresh = false;
    return;
  }
  await page.goto('/admin/bookings', { waitUntil: 'domcontentloaded' });
});

When('I log out in the first admin tab', async () => {
  await firstAdminTab.getByTestId('admin-logout').click();
  await expect(firstAdminTab).toHaveURL(/\/admin\/login/);
});

When('I use the second admin tab', async () => {
  await secondAdminTab.reload();
});

When('I sign in as the seeded admin', async ({ adminLoginPage, page }) => {
  await adminLoginPage.login(env.admin.email, env.admin.password);
  // On success the app stores the token and navigates to the dashboard; wait
  // for that before visiting a protected route.
  await page.waitForURL(/\/admin\/dashboard/);
  await page.goto('/admin/bookings');
});

When(
  'I sign in with email {string} and password {string}',
  async ({ adminLoginPage }, email: string, password: string) => {
    await adminLoginPage.login(email, password);
  },
);

Then('I land on the admin bookings page', async ({ adminBookingsPage }) => {
  await adminBookingsPage.expectLoaded();
});

Then('I am redirected to the admin login page', async ({ page }) => {
  await expect(page).toHaveURL(/\/admin\/login/);
});

Then('the admin access token has been refreshed', async ({ page }) => {
  const currentAccessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  expect(refreshStatus).toBe(200);
  expect(currentAccessToken).not.toBe(originalAccessToken);
});

Then('admin tokens are cleared', async ({ page }) => {
  await expect
    .poll(async () => page.evaluate(() => [localStorage.getItem('accessToken'), localStorage.getItem('refreshToken')]))
    .toEqual([null, null]);
});

Then('the second admin tab is redirected to the admin login page', async () => {
  await expect(secondAdminTab).toHaveURL(/\/admin\/login/);
});

Then('I see an admin login error', async ({ page }) => {
  await expect(page.getByTestId('admin-login-error')).toBeVisible();
});
