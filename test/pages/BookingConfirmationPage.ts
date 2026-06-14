import { BasePage } from './BasePage.js';

export class BookingConfirmationPage extends BasePage {
  /**
   * In tests we forge the Stripe webhook instead of completing the real card,
   * so the app does not auto-redirect here — navigate explicitly by bookingId.
   */
  async open(bookingId: number) {
    await this.goto(`/booking/confirmation/${bookingId}`);
  }

  /** Asserts the raw (non-localized) booking status via the data-status attribute. */
  async expectStatus(expected: string) {
    await this.expectAttr('booking-status-badge', 'data-status', expected);
  }

  /** Asserts the raw payment status via the data-payment-status attribute. */
  async expectPaymentStatus(expected: string) {
    await this.expectAttr('booking-payment-status', 'data-payment-status', expected);
  }

  /** The booking is still awaiting payment (status badge shows pending). */
  async expectProcessing() {
    await this.expectAttr('booking-status-badge', 'data-status', 'pending');
  }
}
