import { expect } from '@playwright/test';
import { Given, When, Then } from '../support/fixtures.js';
import { ProductOrderPage, type ProductOrderPaymentInfo } from '../pages/ProductOrderPage.js';
import { sendPaymentWebhook, paymentIntentIdFromClientSecret } from '../support/stripe-mock.js';
import { getProductOrderByEmail } from '../support/db.js';

// Scenario-scoped state (steps run sequentially within a scenario).
let orderPage: ProductOrderPage;
let order: ProductOrderPaymentInfo;

Given('I am on the product order page for {string}', async ({ page }, product: string) => {
  orderPage = new ProductOrderPage(page);
  await orderPage.open(product);
});

When('I enter my order details', async ({ customerEmail }) => {
  await orderPage.fillCustomer(customerEmail);
});

When('I submit the order', async () => {
  order = await orderPage.submitAndCapturePayment();
});

When('the order payment succeeds', async () => {
  await sendPaymentWebhook(paymentIntentIdFromClientSecret(order.clientSecret), 'succeeded');
});

Then('I see the order marked paid', async () => {
  await orderPage.openConfirmation(order.orderId);
  await orderPage.expectStatus('paid');
});

Then('the order is paid in the database', async ({ customerEmail }) => {
  await expect
    .poll(async () => (await getProductOrderByEmail(customerEmail))?.status, { timeout: 10_000 })
    .toBe('paid');
});
