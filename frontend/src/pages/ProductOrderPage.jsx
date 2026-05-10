import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PublicCard from '../components/public/PublicCard';
import PublicPageShell from '../components/public/PublicPageShell';
import { BOOKING_FLOW_COPY, HOME_COPY } from '../content/publicSiteContent';
import usePublicLanguage from '../hooks/usePublicLanguage';
import productOrderService from '../services/productOrderService';

const PRODUCT_CATALOGUE = {
  'White Magic': {
    subtitle: 'Positive energy work for protection, healing, and spiritual balance.',
    priceCents: 8800,
  },
  'Love Spell': {
    subtitle: 'Open your heart to love, connection, and emotional harmony.',
    priceCents: 8800,
  },
  'Money Spell': {
    subtitle: 'Align your energy with abundance, opportunity, and prosperity.',
    priceCents: 8800,
  },
};

const SummaryRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-outline-variant/60 py-3 text-sm last:border-b-0">
    <span className="text-on-surface-variant">{label}</span>
    <span className="text-right font-semibold text-on-surface">{value}</span>
  </div>
);

const adminInputClass =
  'block w-full rounded-[1.25rem] border border-outline/40 bg-white/80 px-5 py-3.5 text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-0';

const PaymentCheckoutForm = ({ orderId, clientSecret, productName, priceCents, formatMoney, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    try {
      setSubmitting(true);
      setError('');

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/confirmation/${orderId}`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed. Please try again.');
        return;
      }

      navigate(`/order/confirmation/${orderId}`);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <PublicCard title="Payment confirmation">
        {error ? (
          <div className="mb-5 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>
        ) : null}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-[1.5rem] border border-outline-variant/60 bg-white p-4">
            <PaymentElement />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full border border-outline px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
              disabled={submitting}
              onClick={onBack}
            >
              Back to edit
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!stripe || submitting}
            >
              {submitting ? 'Processing payment...' : 'Confirm payment'}
            </button>
          </div>
        </form>
      </PublicCard>

      <PublicCard title="Order summary">
        <SummaryRow label="Product" value={productName} />
        <SummaryRow label="Total" value={formatMoney(priceCents / 100)} />
      </PublicCard>
    </div>
  );
};

const PaymentStep = (props) => {
  if (!props.clientSecret || !props.stripePromise) return null;
  return (
    <Elements options={{ clientSecret: props.clientSecret }} stripe={props.stripePromise}>
      <PaymentCheckoutForm {...props} />
    </Elements>
  );
};

const ProductOrderPage = () => {
  const [searchParams] = useSearchParams();
  const { t, formatMoney } = usePublicLanguage(BOOKING_FLOW_COPY);
  const homeCopy = HOME_COPY.en;
  const productName = searchParams.get('product') || '';
  const productMeta = PRODUCT_CATALOGUE[productName];

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
  const [paymentData, setPaymentData] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitContact = async (e) => {
    e.preventDefault();
    if (!productMeta) return;

    try {
      setSubmitting(true);
      setError('');

      const result = await productOrderService.create({
        productName,
        customerName: `${form.firstName} ${form.lastName}`.trim(),
        customerEmail: form.email,
        customerPhone: form.phone || undefined,
        intention: form.notes || undefined,
        priceCents: productMeta.priceCents,
      });

      setPaymentData(result.data);
      setStripePromise(loadStripe(result.data.publishableKey));
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!productMeta) {
    return (
      <PublicPageShell brand={homeCopy.brand} footer={t.footer} navCopy={t.nav}>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="text-on-surface-variant">Product not found.</p>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell brand={homeCopy.brand} footer={t.footer} navCopy={t.nav}>
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-4 md:px-8">
        <div className="mb-8">
          <p className="mb-4 font-label text-xs uppercase tracking-[0.3em] text-tertiary">Order</p>
          <h1 className="font-headline text-5xl leading-tight text-on-surface md:text-6xl">{productName}</h1>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-on-surface-variant">{productMeta.subtitle}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8">
        {error ? (
          <div className="mb-6 rounded-[1.5rem] bg-error-container px-5 py-4 text-sm text-on-error-container">{error}</div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <PublicCard title="Contact details">
              <form className="space-y-5" onSubmit={handleSubmitContact}>
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-on-surface">First name</span>
                    <input name="firstName" required value={form.firstName} onChange={handleChange} className={adminInputClass} />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-on-surface">Last name</span>
                    <input name="lastName" required value={form.lastName} onChange={handleChange} className={adminInputClass} />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-on-surface">Email</span>
                  <input name="email" type="email" required value={form.email} onChange={handleChange} className={adminInputClass} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-on-surface">Phone</span>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} className={adminInputClass} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-on-surface">Intention (optional)</span>
                  <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} className={`${adminInputClass} resize-none`} placeholder="Share what you are hoping to invite or heal…" />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Continue to payment'}
                </button>
              </form>
            </PublicCard>

            <PublicCard title="Order summary">
              <SummaryRow label="Product" value={productName} />
              <SummaryRow label="Total" value={formatMoney(productMeta.priceCents / 100)} />
              <p className="mt-4 text-xs leading-relaxed text-on-surface-variant">
                Your order is confirmed only after successful payment.
              </p>
            </PublicCard>
          </div>
        ) : (
          <PaymentStep
            orderId={paymentData?.orderId}
            clientSecret={paymentData?.clientSecret}
            stripePromise={stripePromise}
            productName={productName}
            priceCents={productMeta.priceCents}
            formatMoney={formatMoney}
            onBack={() => setStep(1)}
          />
        )}
      </section>
    </PublicPageShell>
  );
};

export default ProductOrderPage;
