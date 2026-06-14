import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

export type ProductOrderPaymentInfo = { clientSecret: string; orderId: number };

export class ProductOrderPage extends BasePage {
  /** /order is a checkout for a specific product passed via the `product` query param. */
  async open(product: string) {
    await this.goto(`/order?product=${encodeURIComponent(product)}`);
  }

  async fillCustomer(email: string) {
    await this.fill('order-first-name', 'Test');
    await this.fill('order-last-name', 'Buyer');
    await this.fill('order-email', email);
  }

  /**
   * Fill the order form with otherwise-valid values, but make one required field
   * blank or the email malformed. Phone/intention are intentionally left empty
   * in the happy paths because they are optional.
   */
  async fillCustomerInvalid(field: string, validEmail: string) {
    const values: Record<string, string> = {
      firstName: 'Test',
      lastName: 'Buyer',
      email: validEmail,
    };
    if (field === 'emailFormat') {
      values.email = 'not-an-email';
    } else {
      values[field] = '';
    }
    await this.fill('order-first-name', values.firstName);
    await this.fill('order-last-name', values.lastName);
    await this.fill('order-email', values.email);
  }

  /** Submits the order and returns orderId + clientSecret from POST /product-orders. */
  async submitAndCapturePayment(): Promise<ProductOrderPaymentInfo> {
    const [response] = await Promise.all([
      this.page.waitForResponse((r) => r.url().includes('/product-orders') && r.request().method() === 'POST'),
      this.page.getByTestId('order-submit').click(),
    ]);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const payload = body?.data ?? body;
    expect(payload?.clientSecret, 'clientSecret in POST /product-orders response').toBeTruthy();
    expect(payload?.orderId, 'orderId in POST /product-orders response').toBeTruthy();
    return { clientSecret: payload.clientSecret, orderId: payload.orderId };
  }

  /**
   * Submit expecting browser-side required/type=email validation to block the
   * request. The checkout should remain on the contact form and never POST.
   */
  async submitExpectingClientError() {
    const postAttempt = this.page
      .waitForResponse((r) => r.url().includes('/product-orders') && r.request().method() === 'POST', {
        timeout: 1_000,
      })
      .then(() => true)
      .catch(() => false);
    await this.page.getByTestId('order-submit').click();
    expect(await postAttempt, 'POST /product-orders should be blocked by client validation').toBe(false);
    await expect(this.page.getByTestId('order-submit')).toBeVisible();
    await expect(this.page.getByTestId('order-email')).toBeVisible();
  }

  /** No auto-redirect in tests (webhook is forged), so navigate explicitly. */
  async openConfirmation(orderId: number) {
    await this.goto(`/order/confirmation/${orderId}`);
  }

  /** Asserts the raw (non-localized) order status via the data-status attribute. */
  async expectStatus(expected: string) {
    await this.expectAttr('order-status-badge', 'data-status', expected);
  }

  async expectProcessing() {
    await expect(this.page.getByTestId('order-confirmation-heading')).toContainText('Processing Payment');
    await this.expectStatus('pending');
  }

  async expectProductNotFound() {
    await this.expectVisible('order-not-found');
  }
}
