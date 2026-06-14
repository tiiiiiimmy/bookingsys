import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { env } from '../support/env.js';

Given('I am on the admin login page', async ({ adminLoginPage }) => {
  await adminLoginPage.open();
});

// Requesting `adminPage` triggers the fixture, which seeds the auth tokens into
// localStorage before the app boots — so no UI login is needed.
Given('I am authenticated as admin', async ({ adminPage }) => {
  void adminPage;
});

When('I open the admin bookings page', async ({ page }) => {
  await page.goto('/admin/bookings');
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

Then('I see an admin login error', async ({ page }) => {
  await expect(page.getByTestId('admin-login-error')).toBeVisible();
});
