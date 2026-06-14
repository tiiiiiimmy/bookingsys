import { Page, expect } from '@playwright/test';

export type ProductOrderPaymentInfo = { clientSecret: string; orderId: number };

export class ProductOrderPage {
  constructor(private page: Page) {}

  /** /order is a checkout for a specific product passed via the `product` query param. */
  async open(product: string) {
    await this.page.goto(`/order?product=${encodeURIComponent(product)}`);
  }

  async fillCustomer(email: string) {
    await this.page.getByTestId('order-first-name').fill('Test');
    await this.page.getByTestId('order-last-name').fill('Buyer');
    await this.page.getByTestId('order-email').fill(email);
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
    await this.page.getByTestId('order-first-name').fill(values.firstName);
    await this.page.getByTestId('order-last-name').fill(values.lastName);
    await this.page.getByTestId('order-email').fill(values.email);
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
    await this.page.goto(`/order/confirmation/${orderId}`);
  }

  /** Asserts the raw (non-localized) order status via the data-status attribute. */
  async expectStatus(expected: string) {
    await expect(this.page.getByTestId('order-status-badge')).toHaveAttribute('data-status', expected, {
      timeout: 15_000,
    });
  }

  async expectProcessing() {
    await expect(this.page.getByTestId('order-confirmation-heading')).toContainText('Processing Payment');
    await this.expectStatus('pending');
  }

  async expectProductNotFound() {
    await expect(this.page.getByTestId('order-not-found')).toBeVisible();
  }
}
