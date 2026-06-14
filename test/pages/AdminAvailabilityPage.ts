import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export class AdminAvailabilityPage extends BasePage {
  async open() {
    await this.goto('/admin/availability');
    await expect(this.page).toHaveURL(/\/admin\/availability/);
  }

  async setBusinessDay(day: number, options: { open?: boolean; start?: string; end?: string }) {
    const row = this.page.locator(`[data-testid="availability-day-row"][data-day="${day}"]`);
    await expect(row).toBeVisible();

    if (options.open !== undefined) {
      const isOpen = await row.getByText(options.open ? /Closed/i : /Open/i).count();
      if (isOpen > 0) {
        await Promise.all([
          this.page.waitForResponse((r) => r.url().includes(`/availability/admin/business-hours/${day}`) && r.request().method() === 'PUT'),
          this.locator(`availability-day-toggle-${day}`).click(),
        ]);
      }
    }

    if (options.start !== undefined) {
      const input = this.locator(`availability-start-${day}`);
      if ((await input.inputValue()) !== options.start) {
        await Promise.all([
          this.page.waitForResponse((r) => r.url().includes(`/availability/admin/business-hours/${day}`) && r.request().method() === 'PUT'),
          input.fill(options.start),
        ]);
      }
    }

    if (options.end !== undefined) {
      const input = this.locator(`availability-end-${day}`);
      if ((await input.inputValue()) !== options.end) {
        await Promise.all([
          this.page.waitForResponse((r) => r.url().includes(`/availability/admin/business-hours/${day}`) && r.request().method() === 'PUT'),
          input.fill(options.end),
        ]);
      }
    }
  }

  async createBlock(startIso: string, endIso: string) {
    if ((await this.locator('availability-block-start').count()) === 0) {
      await this.locator('availability-block-open').click();
    }
    await this.locator('availability-block-start').fill(startIso.slice(0, 16));
    await this.locator('availability-block-end').fill(endIso.slice(0, 16));
    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/availability/admin/blocks') && r.request().method() === 'POST'),
      this.locator('availability-block-create').click(),
    ]);
  }

  async deleteFirstBlock() {
    this.page.once('dialog', (dialog) => dialog.accept());
    await Promise.all([
      this.page.waitForResponse((r) => /\/availability\/admin\/blocks\/\d+$/.test(new URL(r.url()).pathname) && r.request().method() === 'DELETE'),
      this.locator('availability-block-delete').first().click(),
    ]);
  }

  async firstBlockId(): Promise<number> {
    const raw = await this.locator('availability-block-item').first().getAttribute('data-block-id');
    expect(raw).toBeTruthy();
    return Number(raw);
  }

  async expectError(message: string | RegExp) {
    await expect(this.locator('availability-error')).toContainText(message);
  }
}
