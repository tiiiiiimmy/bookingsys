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
}
