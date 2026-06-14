import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { BOOKABLE_SERVICE_TYPE_ID } from '../support/constants.js';
import { insertConfirmedBooking } from '../support/db.js';
import { findNextWeekSlot, toSqlDateTime } from '../support/dates.js';

let bookingId = 0;
let originalStart = '';
let originalEnd = '';

Given('a confirmed booking exists for admin management', async ({ customerEmail }) => {
  const slot = await findNextWeekSlot();
  originalStart = toSqlDateTime(slot.startTime);
  originalEnd = toSqlDateTime(slot.endTime);
  const booking = await insertConfirmedBooking({
    email: customerEmail,
    startTime: originalStart,
    endTime: originalEnd,
    serviceTypeId: BOOKABLE_SERVICE_TYPE_ID,
  });
  bookingId = booking.bookingId;
});

When('I filter admin bookings by confirmed status and that customer email', async ({ adminBookingsPage, customerEmail }) => {
  await adminBookingsPage.applyFilters({ status: 'confirmed', search: customerEmail });
});

When('I filter admin bookings by cancelled status and that customer email', async ({ adminBookingsPage, customerEmail }) => {
  await adminBookingsPage.applyFilters({ status: 'cancelled', search: customerEmail });
});

When("I open that customer's admin booking detail", async ({ adminBookingsPage, customerEmail }) => {
  await adminBookingsPage.openDetailByEmail(customerEmail);
});

Then('the admin booking list includes that customer', async ({ adminBookingsPage, customerEmail }) => {
  await adminBookingsPage.expectRowsForEmail(customerEmail);
});

Then('the admin booking list excludes that customer', async ({ adminBookingsPage, customerEmail }) => {
  await adminBookingsPage.expectNoRowsForEmail(customerEmail);
});

Then('the admin booking detail shows the customer, service, payment, token, and requests', async ({ adminBookingsPage }) => {
  await adminBookingsPage.expectDetailContains('customer', /Seed Customer/);
  await adminBookingsPage.expectDetailContains('service', /Psychic Reading/);
  await adminBookingsPage.expectDetailContains('payment-status', /succeeded/i);
  await adminBookingsPage.expectDetailContains('manage-token', /seed-/);
  await adminBookingsPage.expectDetailContains('reschedule-requests', /No reschedule requests/i);
});
