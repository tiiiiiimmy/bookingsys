import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';

Given('I am on the admin login page', async ({ adminLoginPage }) => {
  await adminLoginPage.open();
});

When('I sign in as the seeded admin', async ({ adminLoginPage, page }) => {
  await adminLoginPage.login('admin@massage.com', 'admin123');
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
