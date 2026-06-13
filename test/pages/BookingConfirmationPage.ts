import { Page, expect } from '@playwright/test';

export class BookingConfirmationPage {
  constructor(private page: Page) {}

  async expectStatus(expected: string) {
    await expect(this.page.getByTestId('booking-status-badge')).toContainText(expected, { timeout: 15_000 });
  }
}
