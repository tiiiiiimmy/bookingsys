import { Locator, Page, expect } from '@playwright/test';
import { UI_ATTR_TIMEOUT } from '../support/constants.js';

/**
 * Shared primitives for page objects: navigation, test-id locators, and the common
 * visibility / attribute assertions. Subclasses inherit `page` and these helpers,
 * so individual pages only describe what is specific to them.
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  protected async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  protected locator(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  protected async fill(testId: string, value: string): Promise<void> {
    await this.page.getByTestId(testId).fill(value);
  }

  protected async expectVisible(testId: string): Promise<void> {
    await expect(this.page.getByTestId(testId)).toBeVisible();
  }

  protected async expectAbsent(testId: string): Promise<void> {
    await expect(this.page.getByTestId(testId)).toHaveCount(0);
  }

  /** Assert a `data-*` attribute that settles via client-side polling (hence the longer timeout). */
  protected async expectAttr(testId: string, attribute: string, value: string): Promise<void> {
    await expect(this.page.getByTestId(testId)).toHaveAttribute(attribute, value, { timeout: UI_ATTR_TIMEOUT });
  }
}
