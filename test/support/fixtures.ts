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
  // Payments are fully mocked via forged webhooks, so the browser never needs
  // real Stripe.js. Block stripe.com to avoid the PaymentStep stalling on the
  // external script load (slow/flaky through a local proxy → blank page).
  page: async ({ page }, use) => {
    await page.route(/(^https?:\/\/|\.)stripe\.com\//, (route) => route.abort());
    await use(page);
  },
  bookingPage: async ({ page }, use) => use(new BookingPage(page)),
  confirmationPage: async ({ page }, use) => use(new BookingConfirmationPage(page)),
  adminLoginPage: async ({ page }, use) => use(new AdminLoginPage(page)),
  adminBookingsPage: async ({ page }, use) => use(new AdminBookingsPage(page)),
  customerEmail: async ({}, use) => use(`cust+${Date.now()}@test.local`),
});

export const { Given, When, Then, Before, After, BeforeAll, AfterAll } = createBdd(test);
