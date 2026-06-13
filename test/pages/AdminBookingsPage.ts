import { Page, expect } from '@playwright/test';

export class AdminBookingsPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/admin\/bookings/);
  }
}
