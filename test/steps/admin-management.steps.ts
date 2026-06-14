import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { BOOKABLE_SERVICE_TYPE_ID } from '../support/constants.js';
import { getAvailableSlots } from '../support/api.js';
import { getBookingTimes, insertConfirmedBooking } from '../support/db.js';
import { addDays, dateKey, findNextWeekSlot, mondayOf, toSqlDateTime } from '../support/dates.js';

let bookingId = 0;
let originalStart = '';
let originalEnd = '';
let validRescheduleStart = '';
let validRescheduleEnd = '';
let rejectedStart = '';
let rejectedEnd = '';

function toDateTimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

function dbDateTime(value: unknown): string {
  if (value instanceof Date) {
    const pad = (part: number) => `${part}`.padStart(2, '0');
    return (
      `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ` +
      `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
    );
  }
  return String(value).replace('T', ' ').slice(0, 19);
}

async function secondOpenSlotAfterSeed(): Promise<{ startTime: string; endTime: string }> {
  const nextMonday = addDays(mondayOf(new Date()), 7);
  for (let offset = 0; offset < 4; offset += 1) {
    const slots = await getAvailableSlots(dateKey(addDays(nextMonday, offset)), 60);
    if (slots.length > 0) return slots[0];
  }
  throw new Error('No available slot found for admin manual reschedule');
}

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

When('I manually reschedule the booking to a valid slot', async ({ adminBookingsPage }) => {
  const slot = await secondOpenSlotAfterSeed();
  validRescheduleStart = toSqlDateTime(slot.startTime);
  validRescheduleEnd = toSqlDateTime(slot.endTime);
  await adminBookingsPage.manualReschedule(toDateTimeLocal(slot.startTime), toDateTimeLocal(slot.endTime));
  await adminBookingsPage.expectMessage(/rescheduled/i);
});

When('I manually reschedule the booking with a duration mismatch', async ({ adminBookingsPage }) => {
  const date = validRescheduleStart.slice(0, 10);
  rejectedStart = `${date} 15:00:00`;
  rejectedEnd = `${date} 15:30:00`;
  await adminBookingsPage.manualReschedule(rejectedStart.replace(' ', 'T').slice(0, 16), rejectedEnd.replace(' ', 'T').slice(0, 16));
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

Then('the admin booking is rescheduled in the database', async () => {
  await expect
    .poll(async () => {
      const times = await getBookingTimes(bookingId);
      return times ? [dbDateTime(times.start_time), dbDateTime(times.end_time)] : [];
    })
    .toEqual([validRescheduleStart, validRescheduleEnd]);
});

Then('the admin reschedule is rejected with a duration error', async ({ adminBookingsPage }) => {
  await adminBookingsPage.expectError(/duration|match service/i);
});

Then('the admin booking time is unchanged', async () => {
  const times = await getBookingTimes(bookingId);
  expect(times).toBeTruthy();
  expect([dbDateTime(times!.start_time), dbDateTime(times!.end_time)]).toEqual([
    validRescheduleStart,
    validRescheduleEnd,
  ]);
  expect([rejectedStart, rejectedEnd]).not.toEqual([validRescheduleStart, validRescheduleEnd]);
});
