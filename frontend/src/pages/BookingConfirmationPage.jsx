import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicCard from '../components/public/PublicCard';
import PublicPageShell from '../components/public/PublicPageShell';
import PublicStatusChip from '../components/public/PublicStatusChip';
import { BOOKING_FLOW_COPY, HOME_COPY } from '../content/publicSiteContent';
import usePublicLanguage from '../hooks/usePublicLanguage';
import bookingService from '../services/bookingService';

const getToneForStatus = (status) => {
  if (status === 'confirmed' || status === 'succeeded') {
    return 'success';
  }

  if (status === 'pending') {
    return 'warning';
  }

  if (status === 'failed' || status === 'cancelled' || status === 'expired') {
    return 'danger';
  }

  return 'neutral';
};

const SummaryRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-outline-variant/60 py-3 text-sm last:border-b-0">
    <span className="text-on-surface-variant">{label}</span>
    <span className="text-right font-semibold text-on-surface">{value}</span>
  </div>
);

const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const { language, setLanguage, t, formatMoney, formatDateTime } = usePublicLanguage(BOOKING_FLOW_COPY);
  const homeCopy = HOME_COPY[language];
  const confirmationCopy = t.confirmation;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    let intervalId;

    const loadBooking = async () => {
      try {
        const response = await bookingService.getBookingById(bookingId);
        if (!isMounted) {
          return;
        }

        setBooking(response.data);
        setError('');
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err.response?.data?.error?.message || confirmationCopy.errors.loadBooking);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBooking();
    intervalId = window.setInterval(loadBooking, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [bookingId, confirmationCopy.errors.loadBooking]);

  const renderHeading = () => {
    if (!booking) {
      return { title: confirmationCopy.title.pending, message: confirmationCopy.message.syncing };
    }

    if (booking.status === 'confirmed') {
      return { title: confirmationCopy.title.confirmed, message: confirmationCopy.message.confirmed };
    }

    if (booking.status === 'expired') {
      return { title: confirmationCopy.title.expired, message: confirmationCopy.message.expired };
    }

    if (booking.payment_status === 'failed') {
      return { title: confirmationCopy.title.paymentFailed, message: confirmationCopy.message.paymentFailed };
    }

    if (booking.status === 'cancelled') {
      return { title: confirmationCopy.title.cancelled, message: confirmationCopy.message.cancelled };
    }

    return { title: confirmationCopy.title.pending, message: confirmationCopy.message.pending };
  };

  const heading = renderHeading();

  return (
    <PublicPageShell
      language={language}
      setLanguage={setLanguage}
      brand={homeCopy.brand}
      footer={t.footer}
      navCopy={t.nav}
    >
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-4 md:px-8">
        <div className="mb-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 font-label text-xs uppercase tracking-[0.3em] text-tertiary">{confirmationCopy.heroTag}</p>
            <h1 className="mb-4 font-headline text-5xl leading-tight text-on-surface md:text-6xl">{heading.title}</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">{heading.message}</p>
          </div>

          <PublicCard title={confirmationCopy.cards.nextSteps}>
            <ul className="space-y-4 text-sm leading-relaxed text-on-surface-variant">
              {confirmationCopy.steps.map((step) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </PublicCard>
        </div>

        {loading ? (
          <PublicCard>
            <p className="text-sm text-on-surface-variant">{confirmationCopy.loading}</p>
          </PublicCard>
        ) : null}

        {!loading && (error || !booking) ? (
          <PublicCard>
            <div className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
              {error || confirmationCopy.notFound}
            </div>
            <div className="mt-6">
              <Link
                className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
                to="/"
              >
                {confirmationCopy.actions.returnHome}
              </Link>
            </div>
          </PublicCard>
        ) : null}

        {!loading && booking ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <PublicCard title={confirmationCopy.cards.bookingDetails}>
                <SummaryRow label={confirmationCopy.labels.bookingId} value={`#${booking.id}`} />
                <SummaryRow label={confirmationCopy.labels.service} value={booking.service_name} />
                <SummaryRow
                  label={confirmationCopy.labels.duration}
                  value={`${booking.duration_minutes} ${homeCopy.services.durationLabel}`}
                />
                <SummaryRow label={confirmationCopy.labels.time} value={formatDateTime(booking.start_time)} />
                <SummaryRow label={confirmationCopy.labels.price} value={formatMoney(booking.price)} />
                <div className="flex items-center justify-between gap-4 border-b border-outline-variant/60 py-3 text-sm">
                  <span className="text-on-surface-variant">{confirmationCopy.labels.status}</span>
                  <PublicStatusChip tone={getToneForStatus(booking.status)}>
                    {t.status.booking[booking.status] || booking.status}
                  </PublicStatusChip>
                </div>
                <div className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="text-on-surface-variant">{confirmationCopy.labels.paymentStatus}</span>
                  <PublicStatusChip tone={getToneForStatus(booking.payment_status || 'pending')}>
                    {t.status.payment[booking.payment_status] || t.status.payment.pending}
                  </PublicStatusChip>
                </div>
                {booking.expires_at && booking.status === 'pending' ? (
                  <div className="border-t border-outline-variant/60 pt-3">
                    <SummaryRow label={confirmationCopy.labels.reservedUntil} value={formatDateTime(booking.expires_at)} />
                  </div>
                ) : null}
              </PublicCard>

              <PublicCard title={confirmationCopy.cards.contact}>
                <SummaryRow label={confirmationCopy.labels.name} value={`${booking.first_name} ${booking.last_name}`} />
                <SummaryRow label={confirmationCopy.labels.email} value={booking.email} />
                <SummaryRow label={confirmationCopy.labels.phone} value={booking.phone} />
                {booking.notes ? <SummaryRow label={confirmationCopy.labels.notes} value={booking.notes} /> : null}
              </PublicCard>
            </div>

            <PublicCard title={confirmationCopy.cards.nextSteps}>
              <div className="rounded-[1.75rem] bg-surface-container p-6">
                <div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-4xl ${
                  booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {booking.status === 'confirmed' ? '✓' : '…'}
                </div>
                <p className="mt-5 text-center text-sm leading-relaxed text-on-surface-variant">{heading.message}</p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
                  to="/"
                >
                  {confirmationCopy.actions.returnHome}
                </Link>
                {booking.status !== 'confirmed' ? (
                  <Link
                    className="inline-flex rounded-full border border-outline px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
                    to="/booking"
                  >
                    {confirmationCopy.actions.rebook}
                  </Link>
                ) : null}
              </div>
            </PublicCard>
          </div>
        ) : null}
      </section>
    </PublicPageShell>
  );
};

export default BookingConfirmationPage;
