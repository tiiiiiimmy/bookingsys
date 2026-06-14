import { Page, expect } from '@playwright/test';

export class ManageBookingPage {
  constructor(private page: Page) {}

  async open(token: string) {
    await this.page.goto(`/booking/manage/${token}`);
  }

  /** Pick a date, choose the first available slot, submit the reschedule request. */
  async requestReschedule(isoDate: string) {
    await this.fillDateAndSubmit(isoDate);
    await expect(this.page.getByTestId('manage-reschedule-result')).toBeVisible({ timeout: 15_000 });
  }

  /** Submit a reschedule request expected to be rejected; assert the error banner matches. */
  async requestRescheduleExpectingError(isoDate: string, message: RegExp) {
    await this.fillDateAndSubmit(isoDate);
    await expect(this.page.getByTestId('manage-reschedule-error')).toContainText(message, { timeout: 15_000 });
  }

  /** Fill the date, pick the first slot, and click submit (shared by success/error flows). */
  private async fillDateAndSubmit(isoDate: string) {
    await this.page.getByTestId('manage-reschedule-date').fill(isoDate);
    await this.page.getByTestId('manage-reschedule-slot').first().click();
    await this.page.getByTestId('manage-reschedule-submit').click();
  }

  /** The booking summary card is shown (page loaded for a valid token). */
  async expectLoaded() {
    await expect(this.page.getByTestId('manage-booking-summary')).toBeVisible();
  }

  /** The load-error banner is shown and no reschedule form is rendered. */
  async expectLoadError() {
    await expect(this.page.getByTestId('manage-load-error')).toBeVisible();
    await expect(this.page.getByTestId('manage-reschedule-submit')).toHaveCount(0);
  }

  /** The reschedule history card is shown. */
  async expectHistoryVisible() {
    await expect(this.page.getByTestId('manage-reschedule-history')).toBeVisible();
  }

  /** The reschedule submit button is disabled (booking can no longer be rescheduled). */
  async expectRescheduleDisabled() {
    await expect(this.page.getByTestId('manage-reschedule-submit')).toBeDisabled();
  }
}
