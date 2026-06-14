import { getAvailableSlots, type AvailableSlot } from './api.js';

/** ISO 'YYYY-MM-DDTHH:mm:ss' -> MySQL DATETIME 'YYYY-MM-DD HH:mm:ss'. */
export function toSqlDateTime(iso: string): string {
  return iso.replace('T', ' ');
}

/** Monday of the week containing `date` (mirrors the booking page's week logic). */
export function mondayOf(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + (day === 0 ? -6 : 1 - day));
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Date key (YYYY-MM-DD) for next Monday, which is always an open day (open days are Mon–Thu). */
export function nextWeekOpenDate(): string {
  return dateKey(addDays(mondayOf(new Date()), 7));
}

/** First available 60-min slot in next week (the open days are Mon–Thu). */
export async function findNextWeekSlot(): Promise<AvailableSlot> {
  const nextMonday = addDays(mondayOf(new Date()), 7);
  for (let offset = 0; offset < 4; offset += 1) {
    const slots = await getAvailableSlots(dateKey(addDays(nextMonday, offset)), 60);
    if (slots.length > 0) return slots[0];
  }
  throw new Error('No available 60-min slot found next week');
}
