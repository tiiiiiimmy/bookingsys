import { Page, expect } from '@playwright/test';

export type BookingPaymentInfo = { clientSecret: string; bookingId: number };

export class BookingPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/booking');
  }

  /**
   * Select a bookable service. The slot API only accepts durations that are a
   * multiple of 30 minutes, so we pick the 60-minute service rather than the
   * (unbookable via slots) 15-minute one.
   */
  async selectBookableService() {
    await this.page.locator('[data-testid="booking-service-option"][data-duration="60"]').click();
  }

  /**
   * Advance to next week. The default view is the current week (Mon–Sun); when
   * "today" is late in the week those days are in the past and have no bookable
   * slots, so we move to a fully-future week which always has active days.
   */
  async goToNextWeek() {
    await this.page.getByTestId('booking-next-week').click();
  }

  async selectFirstSlot() {
    await this.page.getByTestId('booking-slot-item').first().click();
  }

  /**
   * Toggle-select `count` non-overlapping available slots (multi-slot booking in one checkout).
   * Slots are generated every 30 min but the 60-min service spans two steps, so consecutive
   * rendered slots overlap; we stride by 2 to pick non-overlapping ones the backend accepts.
   */
  async selectFirstSlots(count: number) {
    const slots = this.page.getByTestId('booking-slot-item');
    for (let index = 0; index < count; index += 1) {
      await slots.nth(index * 2).click();
    }
  }

  /** Step 1 -> Step 2: advance from slot selection to the customer details form. */
  async proceedToDetails() {
    await this.page.getByTestId('booking-next').click();
  }

  async fillCustomer(email: string) {
    await this.page.getByTestId('booking-first-name').fill('Test');
    await this.page.getByTestId('booking-last-name').fill('Customer');
    await this.page.getByTestId('booking-email').fill(email);
    await this.page.getByTestId('booking-phone').fill('0211234567');
  }

  /**
   * Submits the booking (Step 2) and returns the bookingId + clientSecret from
   * the POST /bookings response. The API wraps the payload as `{ data: {...} }`.
   */
  async submitAndCapturePayment(): Promise<BookingPaymentInfo> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/bookings') && r.request().method() === 'POST'),
      this.page.getByTestId('booking-submit').click(),
    ]);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const payload = body?.data ?? body;
    expect(payload?.clientSecret, 'clientSecret in POST /bookings response').toBeTruthy();
    expect(payload?.bookingId, 'bookingId in POST /bookings response').toBeTruthy();
    return { clientSecret: payload.clientSecret, bookingId: payload.bookingId };
  }
}
