import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AdminBookingsPage extends BasePage {
  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/admin\/bookings/);
  }

  private rowForEmail(email: string) {
    return this.page.locator(`[data-testid="admin-booking-row"][data-email="${email}"]`);
  }

  async applyFilters(filters: { status?: string; search?: string; from?: string; to?: string }) {
    if (filters.from !== undefined) await this.locator('admin-filter-from').fill(filters.from);
    if (filters.to !== undefined) await this.locator('admin-filter-to').fill(filters.to);
    if (filters.status !== undefined) await this.locator('admin-filter-status').selectOption(filters.status);
    if (filters.search !== undefined) await this.locator('admin-filter-search').fill(filters.search);
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/admin/bookings') && r.request().method() === 'GET'),
      this.locator('admin-filter-submit').click(),
    ]);
  }

  async expectRowsForEmail(email: string) {
    await expect(this.rowForEmail(email).first()).toBeVisible();
  }

  async expectNoRowsForEmail(email: string) {
    await expect(this.rowForEmail(email)).toHaveCount(0);
  }

  /** Click the list row whose customer matches `email`, loading its detail panel. */
  async selectBookingByEmail(email: string) {
    await this.rowForEmail(email).click();
  }

  async openDetailByEmail(email: string) {
    await this.selectBookingByEmail(email);
    await expect(this.locator('admin-detail-customer')).toBeVisible();
  }

  async expectDetailContains(
    field: 'customer' | 'service' | 'time' | 'payment-status' | 'manage-token' | 'reschedule-requests',
    value: string | RegExp,
  ) {
    await expect(this.locator(`admin-detail-${field}`)).toContainText(value);
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
