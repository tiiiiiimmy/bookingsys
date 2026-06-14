import type { AvailableSlot } from './api.js';
import { BOOKABLE_SERVICE_TYPE_ID } from './constants.js';
import { findNextWeekSlot, toSqlDateTime } from './dates.js';
import { insertConfirmedBooking, insertPendingBooking } from './db.js';

/** Seed a confirmed booking at the next free 60-min slot next week; returns the booking id + slot. */
export async function seedConfirmedBookingNextWeek(
  email: string,
): Promise<{ bookingId: number; slot: AvailableSlot }> {
  const slot = await findNextWeekSlot();
  const { bookingId } = await insertConfirmedBooking({
    email,
    startTime: toSqlDateTime(slot.startTime),
    endTime: toSqlDateTime(slot.endTime),
    serviceTypeId: BOOKABLE_SERVICE_TYPE_ID,
  });
  return { bookingId, slot };
}

/** Seed a pending booking (live hold) at the next free 60-min slot next week, driven by `paymentIntentId`. */
export async function seedPendingBookingNextWeek(
  email: string,
  paymentIntentId: string,
): Promise<{ bookingId: number; slot: AvailableSlot }> {
  const slot = await findNextWeekSlot();
  const { bookingId } = await insertPendingBooking({
    email,
    startTime: toSqlDateTime(slot.startTime),
    endTime: toSqlDateTime(slot.endTime),
    serviceTypeId: BOOKABLE_SERVICE_TYPE_ID,
    paymentIntentId,
  });
  return { bookingId, slot };
}
