import { Page, expect } from '@playwright/test';

export type BookingPaymentInfo = { clientSecret: string; bookingId: number };

export class BookingPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('/booking');
  }

  async selectFirstService() {
    await this.page.getByTestId('booking-service-option').first().click();
  }

  async selectFirstSlot() {
    await this.page.getByTestId('booking-slot-item').first().click();
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
