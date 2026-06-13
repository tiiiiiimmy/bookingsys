import { Page, expect } from '@playwright/test';

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

  async fillCustomer(email: string) {
    await this.page.getByTestId('booking-first-name').fill('Test');
    await this.page.getByTestId('booking-last-name').fill('Customer');
    await this.page.getByTestId('booking-email').fill(email);
    await this.page.getByTestId('booking-phone').fill('0211234567');
  }

  /** Submits the booking and returns the clientSecret from the POST /bookings response. */
  async submitAndCaptureClientSecret(): Promise<string> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/bookings') && r.request().method() === 'POST'),
      this.page.getByTestId('booking-submit').click(),
    ]);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const clientSecret = body?.data?.clientSecret ?? body?.clientSecret;
    expect(clientSecret, 'clientSecret in POST /bookings response').toBeTruthy();
    return clientSecret;
  }
}
