import { Page, expect } from '@playwright/test';

export class ManageBookingPage {
  constructor(private page: Page) {}

  async open(token: string) {
    await this.page.goto(`/booking/manage/${token}`);
  }

  /** Pick a date, choose the first available slot, submit the reschedule request. */
  async requestReschedule(isoDate: string) {
    await this.page.getByTestId('manage-reschedule-date').fill(isoDate);
    await this.page.getByTestId('manage-reschedule-slot').first().click();
    await this.page.getByTestId('manage-reschedule-submit').click();
    await expect(this.page.getByTestId('manage-reschedule-result')).toBeVisible({ timeout: 15_000 });
  }
}
