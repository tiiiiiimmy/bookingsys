import { Page, expect } from '@playwright/test';

export class BookingConfirmationPage {
  constructor(private page: Page) {}

  /**
   * In tests we forge the Stripe webhook instead of completing the real card,
   * so the app does not auto-redirect here — navigate explicitly by bookingId.
   */
  async open(bookingId: number) {
    await this.page.goto(`/booking/confirmation/${bookingId}`);
  }

  /** Asserts the raw (non-localized) booking status via the data-status attribute. */
  async expectStatus(expected: string) {
    await expect(this.page.getByTestId('booking-status-badge')).toHaveAttribute('data-status', expected, {
      timeout: 15_000,
    });
  }
}
