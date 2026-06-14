import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { sendPaymentWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import {
  getBookingByEmail,
  getBookingTimes,
  getManageToken,
  getRescheduleRequestByBookingId,
  getRescheduleRequestDetail,
  getRescheduleRequestsByBookingId,
  insertConfirmedBooking,
  insertPendingReschedule,
  setBookingStatus,
} from '../support/db.js';
import { findNextWeekSlot, nextWeekOpenDate, toSqlDateTime } from '../support/dates.js';
import { ManageBookingPage } from '../pages/ManageBookingPage.js';
import {
  adminLogin,
  approveRescheduleRequest,
  approveRescheduleRequestRaw,
} from '../support/api.js';

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

// --- TC-RS-05/06: reschedule request conflicts ---

// The slot the customer selected in the UI before a conflict is seeded (TC-RS-06).
let pickedSlot: { startTime: string; endTime: string };

When('the customer submits a second reschedule request for next week', async ({ manageBookingPage }) => {
  await manageBookingPage.requestRescheduleExpectingError(
    nextWeekOpenDate(),
    /already.*pending reschedule request/i,
  );
});

When('the customer picks the first available slot next week', async ({ manageBookingPage }) => {
  pickedSlot = await manageBookingPage.selectDateAndPickFirstSlot(nextWeekOpenDate());
});

When('another booking takes that slot before submission', async ({ customerEmail }) => {
  await insertConfirmedBooking({
    email: customerEmail,
    startTime: toSqlDateTime(pickedSlot.startTime),
    endTime: toSqlDateTime(pickedSlot.endTime),
    serviceTypeId: 12,
  });
});

When('the customer submits the reschedule request expecting a conflict', async ({ manageBookingPage }) => {
  await manageBookingPage.submitExpectingError(/no longer available|conflicts with existing booking/i);
});

Then('the booking has no pending reschedule request', async () => {
  const pending = (await getRescheduleRequestsByBookingId(bookingId)).filter((r) => r.status === 'pending');
  expect(pending).toHaveLength(0);
});

// --- TC-RS-07/08: admin approve/reject via the UI ---

// Booking times captured before a reject, to prove they stay unchanged.
let bookingTimesBefore: { start_time: string; end_time: string };

When('the customer has requested a reschedule', async ({ manageBookingPage, customerEmail }) => {
  const token = (await getManageToken(customerEmail))!.manage_token;
  await manageBookingPage.open(token);
  await manageBookingPage.requestReschedule(nextWeekOpenDate());
});

When("the admin approves the customer's reschedule request", async ({ adminBookingsPage, customerEmail }) => {
  await adminBookingsPage.selectBookingByEmail(customerEmail);
  await adminBookingsPage.approvePendingReschedule();
});

When("the admin rejects the customer's reschedule request", async ({ adminBookingsPage, customerEmail }) => {
  bookingTimesBefore = (await getBookingTimes(bookingId))!;
  await adminBookingsPage.selectBookingByEmail(customerEmail);
  await adminBookingsPage.rejectPendingReschedule();
});

Then('the reschedule request shows as approved', async ({ adminBookingsPage }) => {
  await adminBookingsPage.expectRequestStatus('approved');
});

Then('the reschedule request shows as rejected', async ({ adminBookingsPage }) => {
  await adminBookingsPage.expectRequestStatus('rejected');
});

Then('the booking time matches the approved request', async () => {
  const request = await getRescheduleRequestDetail(bookingId);
  const times = await getBookingTimes(bookingId);
  expect(request?.status).toBe('approved');
  expect(new Date(times!.start_time).getTime()).toBe(new Date(request!.requested_start_time).getTime());
  expect(new Date(times!.end_time).getTime()).toBe(new Date(request!.requested_end_time).getTime());
});

Then('the booking time is unchanged', async () => {
  const times = (await getBookingTimes(bookingId))!;
  expect(new Date(times.start_time).getTime()).toBe(new Date(bookingTimesBefore.start_time).getTime());
  expect(new Date(times.end_time).getTime()).toBe(new Date(bookingTimesBefore.end_time).getTime());
});

// --- TC-RS-09/10/11: review edge cases (API/DB only) ---

let requestId: number;
let secondRequestId: number;
let reviewResponse: Response;
let concurrentResponses: Response[];

Given('a confirmed booking with a pending reschedule request', async ({ customerEmail }) => {
  const slot = await findNextWeekSlot();
  const booking = await insertConfirmedBooking({
    email: customerEmail,
    startTime: toSqlDateTime(slot.startTime),
    endTime: toSqlDateTime(slot.endTime),
    serviceTypeId: 12,
  });
  bookingId = booking.bookingId;
  // The booking now occupies `slot`, so the next free slot is a valid reschedule target.
  const target = await findNextWeekSlot();
  requestId = await insertPendingReschedule(bookingId, toSqlDateTime(target.startTime), toSqlDateTime(target.endTime));
});

Given('the booking has a second pending reschedule request', async () => {
  const target = await findNextWeekSlot();
  secondRequestId = await insertPendingReschedule(
    bookingId,
    toSqlDateTime(target.startTime),
    toSqlDateTime(target.endTime),
  );
});

When('the admin approves the request via the API', async ({ adminToken }) => {
  const res = await approveRescheduleRequestRaw(adminToken, requestId);
  expect(res.ok).toBe(true);
  // Snapshot the post-approval times so a later already-reviewed attempt can prove they don't change.
  bookingTimesBefore = (await getBookingTimes(bookingId))!;
});

When('the admin reviews the same request again', async ({ adminToken }) => {
  reviewResponse = await approveRescheduleRequestRaw(adminToken, requestId);
});

Then('the second review is rejected', () => {
  expect(reviewResponse.ok).toBe(false);
});

When('two admins approve the request at the same time', async ({ adminToken }) => {
  concurrentResponses = await Promise.all([
    approveRescheduleRequestRaw(adminToken, requestId),
    approveRescheduleRequestRaw(adminToken, requestId),
  ]);
});

Then('exactly one review succeeds', () => {
  expect(concurrentResponses.filter((res) => res.ok)).toHaveLength(1);
});

Then('the other pending request is rejected', async () => {
  await expect
    .poll(
      async () =>
        (await getRescheduleRequestsByBookingId(bookingId)).find((r) => r.id === secondRequestId)?.status,
      { timeout: 10_000 },
    )
    .toBe('rejected');
});
