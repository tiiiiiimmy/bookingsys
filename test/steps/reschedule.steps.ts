import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { sendPaymentWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import {
  getBookingByEmail,
  getManageToken,
  getRescheduleRequestByBookingId,
  getRescheduleRequestsByBookingId,
  insertConfirmedBooking,
  setBookingStatus,
} from '../support/db.js';
import { findNextWeekSlot, nextWeekOpenDate, toSqlDateTime } from '../support/dates.js';
import { ManageBookingPage } from '../pages/ManageBookingPage.js';
import { adminLogin, approveRescheduleRequest } from '../support/api.js';

// Scenario-scoped state (steps run sequentially within a scenario).
let bookingId: number;

Given('a confirmed booking exists with a manage token', async ({ bookingPage, customerEmail }) => {
  await bookingPage.open();
  await bookingPage.selectBookableService();
  await bookingPage.goToNextWeek();
  await bookingPage.selectFirstSlot();
  await bookingPage.proceedToDetails();
  await bookingPage.fillCustomer(customerEmail);
  const payment = await bookingPage.submitAndCapturePayment();
  bookingId = payment.bookingId;
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(payment.clientSecret), 'succeeded');
  await expect
    .poll(async () => (await getBookingByEmail(customerEmail))?.status, { timeout: 10_000 })
    .toBe('confirmed');
});

When('the customer requests a new date via the manage link', async ({ page, customerEmail }) => {
  const token = (await getManageToken(customerEmail))!.manage_token;
  const date = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  const manage = new ManageBookingPage(page);
  await manage.open(token);
  await manage.requestReschedule(date);
});

When('the admin approves the reschedule request', async () => {
  const request = await getRescheduleRequestByBookingId(bookingId);
  expect(request, 'a reschedule request should exist').toBeTruthy();
  const token = await adminLogin();
  await approveRescheduleRequest(token, request!.id);
});

Then('the reschedule request is approved in the database', async () => {
  await expect
    .poll(async () => (await getRescheduleRequestByBookingId(bookingId))?.status, { timeout: 10_000 })
    .toBe('approved');
});

// --- TC-RS-02/03/04: manage page states ---

When('the customer opens the manage page', async ({ manageBookingPage, customerEmail }) => {
  const token = (await getManageToken(customerEmail))!.manage_token;
  await manageBookingPage.open(token);
});

Then('the manage page shows the booking summary and history', async ({ manageBookingPage }) => {
  await manageBookingPage.expectLoaded();
  await manageBookingPage.expectHistoryVisible();
});

When('the customer submits a reschedule request for next week', async ({ manageBookingPage }) => {
  await manageBookingPage.requestReschedule(nextWeekOpenDate());
});

Then('the booking has one pending reschedule request', async () => {
  await expect
    .poll(
      async () => (await getRescheduleRequestsByBookingId(bookingId)).filter((r) => r.status === 'pending').length,
      { timeout: 10_000 },
    )
    .toBe(1);
});

When('the customer opens the manage page with an unknown token', async ({ manageBookingPage }) => {
  await manageBookingPage.open('unknown-token-does-not-exist');
});

Then('the manage page shows a load error and no reschedule form', async ({ manageBookingPage }) => {
  await manageBookingPage.expectLoadError();
});

Given('a cancelled booking exists with a manage token', async ({ customerEmail }) => {
  const slot = await findNextWeekSlot();
  const seeded = await insertConfirmedBooking({
    email: customerEmail,
    startTime: toSqlDateTime(slot.startTime),
    endTime: toSqlDateTime(slot.endTime),
    serviceTypeId: 12,
  });
  bookingId = seeded.bookingId;
  await setBookingStatus(bookingId, 'cancelled');
});

Then('the reschedule form is disabled', async ({ manageBookingPage }) => {
  await manageBookingPage.expectRescheduleDisabled();
});
