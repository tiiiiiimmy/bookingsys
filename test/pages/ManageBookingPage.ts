import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class ManageBookingPage extends BasePage {
  async open(token: string) {
    await this.goto(`/booking/manage/${token}`);
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
    await this.selectDateAndPickFirstSlot(isoDate);
    await this.page.getByTestId('manage-reschedule-submit').click();
  }

  /** Fill the date, pick the first available slot, and return its ISO start/end times. */
  async selectDateAndPickFirstSlot(isoDate: string): Promise<{ startTime: string; endTime: string }> {
    await this.page.getByTestId('manage-reschedule-date').fill(isoDate);
    const slot = this.page.getByTestId('manage-reschedule-slot').first();
    await slot.click();
    const startTime = await slot.getAttribute('data-start');
    const endTime = await slot.getAttribute('data-end');
    return { startTime: startTime!, endTime: endTime! };
  }

  /** Submit the (already selected) reschedule request and assert the error banner matches. */
  async submitExpectingError(message: RegExp) {
    await this.page.getByTestId('manage-reschedule-submit').click();
    await expect(this.page.getByTestId('manage-reschedule-error')).toContainText(message, { timeout: 15_000 });
  }

  /** The booking summary card is shown (page loaded for a valid token). */
  async expectLoaded() {
    await this.expectVisible('manage-booking-summary');
  }

  /** The load-error banner is shown and no reschedule form is rendered. */
  async expectLoadError() {
    await this.expectVisible('manage-load-error');
    await this.expectAbsent('manage-reschedule-submit');
  }

  /** The reschedule history card is shown. */
  async expectHistoryVisible() {
    await this.expectVisible('manage-reschedule-history');
  }

  /** The reschedule submit button is disabled (booking can no longer be rescheduled). */
  async expectRescheduleDisabled() {
    await expect(this.page.getByTestId('manage-reschedule-submit')).toBeDisabled();
  }
}
