import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AdminBookingsPage extends BasePage {
  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/admin\/bookings/);
  }

  /** Click the list row whose customer matches `email`, loading its detail panel. */
  async selectBookingByEmail(email: string) {
    await this.page.locator(`[data-testid="admin-booking-row"][data-email="${email}"]`).click();
  }

  /** Approve the first pending reschedule request (accepting the adminNote prompt). */
  async approvePendingReschedule() {
    this.page.once('dialog', (dialog) => dialog.accept(''));
    await this.page.getByTestId('admin-reschedule-approve').first().click();
  }

  /** Reject the first pending reschedule request (accepting the adminNote prompt). */
  async rejectPendingReschedule() {
    this.page.once('dialog', (dialog) => dialog.accept(''));
    await this.page.getByTestId('admin-reschedule-reject').first().click();
  }

  /** Assert the (first) reschedule request row reflects the expected status. */
  async expectRequestStatus(status: string) {
    await expect(this.page.getByTestId('admin-reschedule-request').first()).toHaveAttribute(
      'data-status',
      status,
    );
  }
}
