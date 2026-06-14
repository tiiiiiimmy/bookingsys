import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { sendPaymentWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import { getBookingByEmail, getManageToken, getRescheduleRequestByBookingId } from '../support/db.js';
import { ManageBookingPage } from '../pages/ManageBookingPage.js';
import { adminLogin, approveRescheduleRequest } from '../support/api.js';

// Scenario-scoped state (steps run sequentially within a scenario).
let bookingId: number;

Given('a confirmed booking exists with a manage token', async ({ bookingPage, customerEmail }) => {
  await bookingPage.open();
  await bookingPage.selectFirstService();
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
