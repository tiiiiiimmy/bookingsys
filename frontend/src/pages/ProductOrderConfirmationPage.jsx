import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicCard from '../components/public/PublicCard';
import PublicPageShell from '../components/public/PublicPageShell';
import { BOOKING_FLOW_COPY, HOME_COPY } from '../content/publicSiteContent';
import usePublicLanguage from '../hooks/usePublicLanguage';
import productOrderService from '../services/productOrderService';

const SummaryRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-outline-variant/60 py-3 text-sm last:border-b-0">
    <span className="text-on-surface-variant">{label}</span>
    <span className="text-right font-semibold text-on-surface">{value}</span>
  </div>
);

const ProductOrderConfirmationPage = () => {
  const { orderId } = useParams();
  const { t, formatMoney } = usePublicLanguage(BOOKING_FLOW_COPY);
  const homeCopy = HOME_COPY.en;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const loadOrder = async () => {
      try {
        const response = await productOrderService.getById(orderId);
        if (!isMounted) return;
        setOrder(response.data);
        setError('');
        if (response.data?.status === 'paid' || response.data?.status === 'fulfilled') {
          window.clearInterval(intervalId);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.error?.message || 'Unable to load order details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrder();
    intervalId = window.setInterval(loadOrder, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [orderId]);

  const isPaid = order?.status === 'paid' || order?.status === 'fulfilled';

  const heading = isPaid
    ? { title: 'Order Confirmed', message: 'Your order has been received and payment confirmed. We will be in touch soon.' }
    : { title: 'Processing Payment', message: 'We are confirming your payment. This page will update automatically.' };

  return (
    <PublicPageShell brand={homeCopy.brand} footer={t.footer} navCopy={t.nav}>
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-4 md:px-8">
        <div className="mb-8">
          <p className="mb-4 font-label text-xs uppercase tracking-[0.3em] text-tertiary">Order</p>
          <h1 data-testid="order-confirmation-heading" className="mb-4 font-headline text-5xl leading-tight text-on-surface md:text-6xl">{heading.title}</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">{heading.message}</p>
        </div>

        {loading ? (
          <PublicCard>
            <p className="text-sm text-on-surface-variant">Loading order details…</p>
          </PublicCard>
        ) : null}

        {!loading && (error || !order) ? (
          <PublicCard>
            <div className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
              {error || 'Order not found.'}
            </div>
            <div className="mt-6">
              <Link
                className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
                to="/"
              >
                Return Home
              </Link>
            </div>
          </PublicCard>
        ) : null}

        {!loading && order ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <PublicCard title="Order Details">
              <SummaryRow label="Order ID" value={`#${order.id}`} />
              <SummaryRow label="Product" value={order.productName} />
              <SummaryRow label="Customer" value={order.customerName} />
              <SummaryRow label="Email" value={order.customerEmail} />
              {order.customerPhone ? <SummaryRow label="Phone" value={order.customerPhone} /> : null}
              {order.intention ? <SummaryRow label="Intention" value={order.intention} /> : null}
              <SummaryRow label="Total" value={formatMoney(order.priceCents / 100)} />
              <span data-testid="order-status-badge" data-status={order.status} hidden />
              <SummaryRow label="Status" value={order.status.charAt(0).toUpperCase() + order.status.slice(1)} />
            </PublicCard>

            <PublicCard title="What's Next">
              <div className="rounded-[1.75rem] bg-surface-container p-6">
                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-4xl ${
                  isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isPaid ? '✓' : '…'}
                </div>
                <p className="mt-5 text-center text-sm leading-relaxed text-on-surface-variant">{heading.message}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
                  to="/"
                >
                  Return Home
                </Link>
              </div>
            </PublicCard>
          </div>
        ) : null}
      </section>
    </PublicPageShell>
  );
};

export default ProductOrderConfirmationPage;
