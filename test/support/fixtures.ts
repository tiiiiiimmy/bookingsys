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
