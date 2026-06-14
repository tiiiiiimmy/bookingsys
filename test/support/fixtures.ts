import { test as base, createBdd } from 'playwright-bdd';
import type { Page } from '@playwright/test';
import { BookingPage } from '../pages/BookingPage.js';
import { BookingConfirmationPage } from '../pages/BookingConfirmationPage.js';
import { AdminLoginPage } from '../pages/AdminLoginPage.js';
import { AdminBookingsPage } from '../pages/AdminBookingsPage.js';
import { AdminAvailabilityPage } from '../pages/AdminAvailabilityPage.js';
import { ManageBookingPage } from '../pages/ManageBookingPage.js';
import { ProductOrderPage } from '../pages/ProductOrderPage.js';
import { adminLogin, seedAdminAuthInBrowser } from './api.js';

type Fixtures = {
  bookingPage: BookingPage;
  confirmationPage: BookingConfirmationPage;
  adminLoginPage: AdminLoginPage;
  adminBookingsPage: AdminBookingsPage;
  adminAvailabilityPage: AdminAvailabilityPage;
  manageBookingPage: ManageBookingPage;
  productOrderPage: ProductOrderPage;
  /** Per-scenario unique customer email for data isolation. */
  customerEmail: string;
  /** Admin access token (API login) for scenarios that drive admin actions via the API. */
  adminToken: string;
  /** A page that boots already authenticated as admin (skips the UI login screen). */
  adminPage: Page;
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
  adminAvailabilityPage: async ({ page }, use) => use(new AdminAvailabilityPage(page)),
  manageBookingPage: async ({ page }, use) => use(new ManageBookingPage(page)),
  productOrderPage: async ({ page }, use) => use(new ProductOrderPage(page)),
  customerEmail: async ({}, use) => use(`cust+${Date.now()}@test.local`),
  adminToken: async ({}, use) => use(await adminLogin()),
  adminPage: async ({ page }, use) => {
    await seedAdminAuthInBrowser(page);
    await use(page);
  },
});

export const { Given, When, Then, Before, After, BeforeAll, AfterAll } = createBdd(test);
