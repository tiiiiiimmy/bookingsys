import { expect } from '@playwright/test';
import { Given, When, Then, After } from '../support/fixtures.js';
import { sendPaymentWebhook, sendUnsignedWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import {
  expireBookingHold,
  getBookingByEmail,
  getBookingsByEmail,
  getBookingStatusReason,
  insertPendingBooking,
} from '../support/db.js';
import {
  adminLogin,
  bookSlotViaApi,
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  getAvailableSlots,
  getSlotsResponse,
  type AvailableSlot,
} from '../support/api.js';
import { BOOKABLE_SERVICE_TYPE_ID } from '../support/constants.js';
import { addDays, dateKey, findNextWeekSlot, mondayOf, toSqlDateTime } from '../support/dates.js';
import { seedConfirmedBookingNextWeek, seedPendingBookingNextWeek } from '../support/seed.js';
import type { BookingPaymentInfo } from '../pages/BookingPage.js';

// Scenario-scoped state (steps run sequentially within a scenario).
let payment: BookingPaymentInfo;
let occupiedSlotStart: string;
let slotsResponse: Response;
let slotsBody: { error?: { message?: string } };
let availableSlots: AvailableSlot[];
let blockedSlotStart: string;
let createdBlockId = 0;
// Concurrency / hold-expiry state.
let concurrencySlot: AvailableSlot;
let bookingAId: number;
let bookingBId: number;
let piA: string;
let piB: string;
let bookResponse: Response;
let bookBody: { error?: { message?: string } };

// Remove any availability block a scenario created, even on failure.
After(async () => {
  if (createdBlockId) {
    await deleteAvailabilityBlock(await adminLogin(), createdBlockId);
    createdBlockId = 0;
  }
});

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
  const { slot } = await seedConfirmedBookingNextWeek(customerEmail);
  occupiedSlotStart = slot.startTime;
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

Then('the closed day next week offers no slots', async ({ bookingPage }) => {
  // Friday next week is a closed day (open days are Mon–Thu).
  const friday = dateKey(addDays(mondayOf(new Date()), 7 + 4));
  await bookingPage.expectNoSlotsOnDate(friday);
});

When('I request availability for an open day next week', async () => {
  availableSlots = await getAvailableSlots(dateKey(addDays(mondayOf(new Date()), 7)), 60);
});

Then('a slot starts at the opening time', () => {
  expect(availableSlots.some((slot) => slot.startTime.endsWith('T09:00:00'))).toBe(true);
});

Then('a slot ends at the closing time', () => {
  expect(availableSlots.some((slot) => slot.endTime.endsWith('T17:00:00'))).toBe(true);
});

Given('an admin blocks the first open slot next week', async ({ adminToken }) => {
  const slot = await findNextWeekSlot();
  blockedSlotStart = slot.startTime;
  const block = await createAvailabilityBlock(adminToken, slot.startTime, slot.endTime);
  createdBlockId = block.id;
});

Then('the blocked slot is no longer available', async () => {
  const slots = await getAvailableSlots(blockedSlotStart.slice(0, 10), 60);
  expect(slots.some((slot) => slot.startTime === blockedSlotStart)).toBe(false);
});

// --- Concurrency & hold expiry (TC-BK-08/09/10) ---

Given('customer A holds a slot next week without paying', async ({ customerEmail }) => {
  piA = `pi_hold_${Date.now()}`;
  const seeded = await seedPendingBookingNextWeek(customerEmail, piA);
  bookingAId = seeded.bookingId;
  concurrencySlot = seeded.slot;
});

When('customer B attempts to book the same slot', async ({ customerEmail }) => {
  bookResponse = await bookSlotViaApi({
    email: customerEmail,
    startTime: concurrencySlot.startTime,
    endTime: concurrencySlot.endTime,
    serviceTypeId: BOOKABLE_SERVICE_TYPE_ID,
  });
  bookBody = await bookResponse.json().catch(() => ({}));
});

Then('customer B is rejected with a slot conflict', () => {
  expect(bookResponse.status).toBe(409);
  expect(bookBody?.error?.message ?? '').toMatch(/no longer available|conflicts with existing booking/);
});

Given("customer A has paid and confirmed a slot next week", async ({ customerEmail }) => {
  piA = `pi_a_${Date.now()}`;
  const seeded = await seedPendingBookingNextWeek(customerEmail, piA);
  bookingAId = seeded.bookingId;
  concurrencySlot = seeded.slot;
  // Confirm A while it is the only hold on the slot, so its succeeded webhook finds no conflict.
  await sendPaymentWebhook(piA, 'succeeded');
  await expect
    .poll(async () => (await getBookingStatusReason(bookingAId))?.status, { timeout: 10_000 })
    .toBe('confirmed');
});

When('customer B pays for the same slot', async ({ customerEmail }) => {
  piB = `pi_b_${Date.now()}`;
  const b = await insertPendingBooking({
    email: customerEmail,
    startTime: toSqlDateTime(concurrencySlot.startTime),
    endTime: toSqlDateTime(concurrencySlot.endTime),
    serviceTypeId: BOOKABLE_SERVICE_TYPE_ID,
    paymentIntentId: piB,
  });
  bookingBId = b.bookingId;
  await sendPaymentWebhook(piB, 'succeeded');
});

Then("customer A's booking stays confirmed", async () => {
  expect((await getBookingStatusReason(bookingAId))?.status).toBe('confirmed');
});

Then("customer B's booking is cancelled for review", async () => {
  await expect
    .poll(async () => (await getBookingStatusReason(bookingBId))?.status, { timeout: 10_000 })
    .toBe('cancelled');
  expect((await getBookingStatusReason(bookingBId))?.cancellation_reason ?? '').toContain(
    'hold expired or conflicted',
  );
});

Given('a booking whose hold has expired', async ({ customerEmail }) => {
  piA = `pi_exp_${Date.now()}`;
  const seeded = await seedPendingBookingNextWeek(customerEmail, piA);
  bookingAId = seeded.bookingId;
  await expireBookingHold(bookingAId);
});

When("the expired booking's payment succeeds", async () => {
  await sendPaymentWebhook(piA, 'succeeded');
});

Then('the booking is cancelled for review', async () => {
  await expect
    .poll(async () => (await getBookingStatusReason(bookingAId))?.status, { timeout: 10_000 })
    .toBe('cancelled');
  expect((await getBookingStatusReason(bookingAId))?.cancellation_reason ?? '').toContain(
    'hold expired or conflicted',
  );
});

Then('the payment is recorded as succeeded', async ({ customerEmail }) => {
  await expect
    .poll(async () => (await getBookingByEmail(customerEmail))?.payment_status, { timeout: 10_000 })
    .toBe('succeeded');
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
