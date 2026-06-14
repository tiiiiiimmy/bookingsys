import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { sendPaymentWebhook, sendUnsignedWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import { getBookingByEmail } from '../support/db.js';
import type { BookingPaymentInfo } from '../pages/BookingPage.js';

// Scenario-scoped state (steps run sequentially within a scenario).
let payment: BookingPaymentInfo;

Given('I am on the booking page', async ({ bookingPage }) => {
  await bookingPage.open();
});

When('I select the first available service and slot', async ({ bookingPage }) => {
  await bookingPage.selectBookableService();
  await bookingPage.goToNextWeek();
  await bookingPage.selectFirstSlot();
  await bookingPage.proceedToDetails();
});

When('I enter my customer details', async ({ bookingPage, customerEmail }) => {
  await bookingPage.fillCustomer(customerEmail);
});

When('I submit the booking', async ({ bookingPage }) => {
  payment = await bookingPage.submitAndCapturePayment();
});

When('the payment succeeds', async () => {
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(payment.clientSecret), 'succeeded');
});

When('the payment fails', async () => {
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(payment.clientSecret), 'failed');
});

When('a webhook with an invalid signature arrives', async () => {
  const status = await sendUnsignedWebhook(paymentIntentIdFromClientSecret(payment.clientSecret));
  expect(status).toBe(400);
});

Then('I see the booking confirmed', async ({ confirmationPage }) => {
  await confirmationPage.open(payment.bookingId);
  await confirmationPage.expectStatus('confirmed');
});

Then('the booking is confirmed in the database', async ({ customerEmail }) => {
  await expect
    .poll(async () => (await getBookingByEmail(customerEmail))?.status, { timeout: 10_000 })
    .toBe('confirmed');
});

Then('the booking is not confirmed in the database', async ({ customerEmail }) => {
  const booking = await getBookingByEmail(customerEmail);
  expect(booking?.status).not.toBe('confirmed');
});
