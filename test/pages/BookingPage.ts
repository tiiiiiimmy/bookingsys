import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export type BookingPaymentInfo = { clientSecret: string; bookingId: number };

export class BookingPage extends BasePage {
  async open() {
    await this.goto('/booking');
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

  /**
   * Assert a specific slot (identified by its ISO startTime via `data-start`) is NOT
   * offered for the visible week, while other slots did load. A confirmed/pending
   * booking removes its slot from availability (Phase 0.1), so the conflict shows as
   * an absent slot rather than an error banner.
   */
  async expectSlotAbsent(startTime: string) {
    await expect(this.page.getByTestId('booking-slot-item').first()).toBeVisible();
    await expect(
      this.page.locator(`[data-testid="booking-slot-item"][data-start="${startTime}"]`),
    ).toHaveCount(0);
  }

  /** Assert the booking error banner is shown and contains the expected copy. */
  async expectError(message: string | RegExp) {
    await expect(this.page.getByTestId('booking-error')).toContainText(message);
  }

  /**
   * Assert a given day (by date key 'YYYY-MM-DD') offers no slots, while the week did
   * render — used for closed days, whose column shows the empty-state instead of slots.
   */
  async expectNoSlotsOnDate(dateKey: string) {
    await expect(this.page.locator('[data-testid="booking-day"]').first()).toBeVisible();
    await expect(
      this.page.locator(`[data-testid="booking-day"][data-date="${dateKey}"] [data-testid="booking-slot-item"]`),
    ).toHaveCount(0);
  }

  async fillCustomer(email: string) {
    await this.fill('booking-first-name', 'Test');
    await this.fill('booking-last-name', 'Customer');
    await this.fill('booking-email', email);
    await this.fill('booking-phone', '0211234567');
  }

  /**
   * Fill the customer form with otherwise-valid values, but make one field invalid:
   * a blank required field (`firstName`/`lastName`/`email`/`phone`) or a malformed
   * email (`emailFormat`). Drives the HTML5 client-side validation cases.
   */
  async fillCustomerInvalid(field: string, validEmail: string) {
    const values: Record<string, string> = {
      firstName: 'Test',
      lastName: 'Customer',
      email: validEmail,
      phone: '0211234567',
    };
    if (field === 'emailFormat') {
      values.email = 'not-an-email';
    } else {
      values[field] = '';
    }
    await this.fill('booking-first-name', values.firstName);
    await this.fill('booking-last-name', values.lastName);
    await this.fill('booking-email', values.email);
    await this.fill('booking-phone', values.phone);
  }

  /**
   * Submit the customer form expecting client-side (HTML5 `required` / `type=email`)
   * validation to block it: no booking is created and the form stays on the details
   * step (the payment step is never reached).
   */
  async submitExpectingClientError() {
    await this.page.getByTestId('booking-submit').click();
    await expect(this.page.getByTestId('booking-submit')).toBeVisible();
    await expect(this.page.getByTestId('booking-email')).toBeVisible();
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
