import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { sendPaymentWebhook, sendUnsignedWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import { getBookingByEmail, getBookingsByEmail, insertConfirmedBooking } from '../support/db.js';
import { getAvailableSlots, getSlotsResponse } from '../support/api.js';
import type { BookingPaymentInfo } from '../pages/BookingPage.js';

// Scenario-scoped state (steps run sequentially within a scenario).
let payment: BookingPaymentInfo;
let occupiedSlotStart: string;
let slotsResponse: Response;
let slotsBody: { error?: { message?: string } };

/** Monday of the week containing `date` (mirrors the booking page's week logic). */
function mondayOf(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** First available 60-min slot in next week (the open days are Mon–Thu). */
async function findNextWeekSlot(): Promise<{ startTime: string; endTime: string }> {
  const nextMonday = addDays(mondayOf(new Date()), 7);
  for (let offset = 0; offset < 4; offset += 1) {
    const slots = await getAvailableSlots(dateKey(addDays(nextMonday, offset)), 60);
    if (slots.length > 0) return slots[0];
  }
  throw new Error('No available 60-min slot found next week to seed a conflict');
}

Given('I am on the booking page', async ({ bookingPage }) => {
  await bookingPage.open();
});

When('I select the first available service and slot', async ({ bookingPage }) => {
  await bookingPage.selectBookableService();
  await bookingPage.goToNextWeek();
  await bookingPage.selectFirstSlot();
  await bookingPage.proceedToDetails();
});

When('I select a bookable service and {int} slots', async ({ bookingPage }, count: number) => {
  await bookingPage.selectBookableService();
  await bookingPage.goToNextWeek();
  await bookingPage.selectFirstSlots(count);
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

When('I open the booking confirmation page', async ({ confirmationPage }) => {
  await confirmationPage.open(payment.bookingId);
});

Then('I see the booking confirmed', async ({ confirmationPage }) => {
  await confirmationPage.open(payment.bookingId);
  await confirmationPage.expectStatus('confirmed');
});

Then('I see the payment marked failed', async ({ confirmationPage }) => {
  await confirmationPage.expectPaymentStatus('failed');
});

Then('I see the booking still processing', async ({ confirmationPage }) => {
  await confirmationPage.expectProcessing();
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

Given('a confirmed booking already occupies a slot next week', async ({ customerEmail }) => {
  const slot = await findNextWeekSlot();
  occupiedSlotStart = slot.startTime;
  // ISO 'YYYY-MM-DDTHH:mm:ss' -> MySQL DATETIME 'YYYY-MM-DD HH:mm:ss'.
  await insertConfirmedBooking({
    email: customerEmail,
    startTime: slot.startTime.replace('T', ' '),
    endTime: slot.endTime.replace('T', ' '),
    serviceTypeId: 12,
  });
});

When('I view next week for the bookable service', async ({ bookingPage }) => {
  await bookingPage.selectBookableService();
  await bookingPage.goToNextWeek();
});

Then('the occupied slot is no longer offered', async ({ bookingPage }) => {
  await bookingPage.expectSlotAbsent(occupiedSlotStart);
});

When('I enter customer details with an invalid {string}', async ({ bookingPage, customerEmail }, field: string) => {
  await bookingPage.fillCustomerInvalid(field, customerEmail);
});

When('I submit the booking form expecting a client-side error', async ({ bookingPage }) => {
  await bookingPage.submitExpectingClientError();
});

Then('no booking is created for the customer', async ({ customerEmail }) => {
  expect(await getBookingByEmail(customerEmail)).toBeUndefined();
});

When('I request availability for a past date', async () => {
  slotsResponse = await getSlotsResponse(dateKey(addDays(new Date(), -1)), 60);
  slotsBody = await slotsResponse.json();
});

When('I request availability with a 45-minute duration', async () => {
  // Next Monday is an open day; the duration check fires before any date/hours logic.
  slotsResponse = await getSlotsResponse(dateKey(addDays(mondayOf(new Date()), 7)), 45);
  slotsBody = await slotsResponse.json();
});

Then('the availability request is rejected because the date is in the past', () => {
  expect(slotsResponse.status).toBe(400);
  expect(slotsBody?.error?.message ?? '').toContain('past');
});

Then('the availability request is rejected because the duration is invalid', () => {
  expect(slotsResponse.status).toBe(400);
  expect(slotsBody?.error?.message ?? '').toContain('multiple of 30');
});

Then('all bookings for the customer are confirmed', async ({ customerEmail }) => {
  await expect
    .poll(
      async () => {
        const bookings = await getBookingsByEmail(customerEmail);
        return bookings.length >= 2 && bookings.every((b) => b.status === 'confirmed');
      },
      { timeout: 10_000 },
    )
    .toBe(true);
});
