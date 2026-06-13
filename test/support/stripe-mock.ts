import crypto from 'node:crypto';
import { env } from './env.js';

type Outcome = 'succeeded' | 'failed';

/** Derive the PaymentIntent id from a Stripe client secret (`pi_x_secret_y` -> `pi_x`). */
export function paymentIntentIdFromClientSecret(clientSecret: string): string {
  return clientSecret.split('_secret')[0];
}

function sign(rawBody: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const hmac = crypto
    .createHmac('sha256', env.stripe.webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

/**
 * Forge and POST a Stripe webhook to the backend, deterministically driving
 * a payment to `succeeded` or `failed`. We own STRIPE_WEBHOOK_SECRET in the
 * test env, so the signature verifies.
 */
export async function sendPaymentWebhook(paymentIntentId: string, outcome: Outcome): Promise<void> {
  const type = outcome === 'succeeded' ? 'payment_intent.succeeded' : 'payment_intent.payment_failed';
  const event = {
    id: `evt_test_${Date.now()}`,
    type,
    data: {
      object: {
        id: paymentIntentId,
        object: 'payment_intent',
        latest_charge: `ch_test_${Date.now()}`,
      },
    },
  };
  const rawBody = JSON.stringify(event);
  const res = await fetch(`${env.apiUrl}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': sign(rawBody) },
    body: rawBody,
  });
  if (!res.ok) throw new Error(`Webhook POST failed: ${res.status} ${await res.text()}`);
}

/** Forge a webhook with a deliberately invalid signature (exception scenario). */
export async function sendUnsignedWebhook(paymentIntentId: string): Promise<number> {
  const rawBody = JSON.stringify({
    type: 'payment_intent.succeeded',
    data: { object: { id: paymentIntentId } },
  });
  const res = await fetch(`${env.apiUrl}/webhooks/stripe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': 't=1,v1=deadbeef' },
    body: rawBody,
  });
  return res.status; // expected 400
}
