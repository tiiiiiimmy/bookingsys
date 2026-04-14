import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PublicCard from '../components/public/PublicCard';
import PublicPageShell from '../components/public/PublicPageShell';
import PublicStatusChip from '../components/public/PublicStatusChip';
import { BOOKING_FLOW_COPY, HOME_COPY } from '../content/publicSiteContent';
import usePublicLanguage from '../hooks/usePublicLanguage';
import availabilityService from '../services/availabilityService';
import bookingService from '../services/bookingService';

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const getToneForStatus = (status) => {
  if (status === 'approved' || status === 'confirmed' || status === 'succeeded') {
    return 'success';
  }

  if (status === 'pending') {
    return 'warning';
  }

  if (status === 'rejected' || status === 'cancelled' || status === 'failed') {
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

const ManageBookingPage = () => {
  const { token } = useParams();
  const { language, setLanguage, t, formatDateTime, formatTime } = usePublicLanguage(BOOKING_FLOW_COPY);
  const homeCopy = HOME_COPY[language];
  const manageCopy = t.manage;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customerNote, setCustomerNote] = useState('');

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getManagedBooking(token);
      setBooking(response.data);
    } catch (err) {
      setError(extractError(err, manageCopy.errors.loadBooking));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [token]);

  useEffect(() => {
    if (!selectedDate || !booking) {
      return;
    }

    const loadSlots = async () => {
      try {
        setLoadingSlots(true);
        setError('');
        const response = await availabilityService.getAvailableSlots(selectedDate, booking.durationMinutes);
        setSlots(response.data?.slots || []);
      } catch (err) {
        setError(extractError(err, manageCopy.errors.loadSlots));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [booking, manageCopy.errors.loadSlots, selectedDate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSlot) {
      setError(manageCopy.errors.chooseSlot);
      return;
    }

    try {
      setError('');
      setMessage('');
      await bookingService.createRescheduleRequest(token, {
        requestedStartTime: selectedSlot.startTime,
        requestedEndTime: selectedSlot.endTime,
        customerNote,
      });
      setMessage(manageCopy.messages.submitted);
      setSelectedSlot(null);
      setCustomerNote('');
      setSelectedDate('');
      setSlots([]);
      await loadBooking();
    } catch (err) {
      setError(extractError(err, manageCopy.errors.submit));
    }
  };

  return (
    <PublicPageShell
      language={language}
      setLanguage={setLanguage}
      brand={homeCopy.brand}
      footer={t.footer}
      navCopy={t.nav}
    >
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-4 md:px-8">
        <div className="mb-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 font-label text-xs uppercase tracking-[0.3em] text-tertiary">{manageCopy.heroTag}</p>
            <h1 className="mb-4 font-headline text-5xl leading-tight text-on-surface md:text-6xl">{manageCopy.title}</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">{manageCopy.description}</p>
          </div>

          <PublicCard title={manageCopy.cards.instructions}>
            <p className="text-sm leading-relaxed text-on-surface-variant">{manageCopy.instructions}</p>
          </PublicCard>
        </div>

        {loading ? (
          <PublicCard>
            <p className="text-sm text-on-surface-variant">{manageCopy.loading.page}</p>
          </PublicCard>
        ) : null}

        {!loading && error && !booking ? (
          <PublicCard>
            <div className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>
            <div className="mt-6">
              <Link
                className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-container"
                to="/"
              >
                {manageCopy.actions.returnHome}
              </Link>
            </div>
          </PublicCard>
        ) : null}

        {!loading && booking ? (
          <div className="space-y-6">
            {error ? (
              <div className="rounded-[1.5rem] bg-error-container px-5 py-4 text-sm text-on-error-container">{error}</div>
            ) : null}
            {message ? (
              <div className="rounded-[1.5rem] bg-emerald-100 px-5 py-4 text-sm text-emerald-800">{message}</div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <PublicCard title={manageCopy.cards.currentBooking}>
                  <SummaryRow label={manageCopy.labels.customer} value={booking.customerName} />
                  <SummaryRow label={manageCopy.labels.service} value={booking.serviceName} />
                  <SummaryRow
                    label={manageCopy.labels.duration}
                    value={`${booking.durationMinutes} ${homeCopy.services.durationLabel}`}
                  />
                  <SummaryRow label={manageCopy.labels.time} value={formatDateTime(booking.startTime)} />
                  <div className="flex items-center justify-between gap-4 border-b border-outline-variant/60 py-3 text-sm">
                    <span className="text-on-surface-variant">{manageCopy.labels.status}</span>
                    <PublicStatusChip tone={getToneForStatus(booking.status)}>
                      {t.status.booking[booking.status] || booking.status}
                    </PublicStatusChip>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-outline-variant/60 py-3 text-sm">
                    <span className="text-on-surface-variant">{manageCopy.labels.paymentStatus}</span>
                    <PublicStatusChip tone={getToneForStatus(booking.paymentStatus || 'pending')}>
                      {t.status.payment[booking.paymentStatus] || t.status.payment.pending}
                    </PublicStatusChip>
                  </div>
                  <SummaryRow label={manageCopy.labels.supportEmail} value={booking.supportEmail} />
                </PublicCard>

                <PublicCard title={manageCopy.cards.history}>
                  {!booking.rescheduleRequests?.length ? (
                    <p className="text-sm text-on-surface-variant">{manageCopy.empty.noHistory}</p>
                  ) : (
                    <div className="space-y-3">
                      {booking.rescheduleRequests.map((request) => (
                        <div key={request.id} className="rounded-[1.5rem] border border-outline-variant/70 bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-on-surface">{formatDateTime(request.requestedStartTime)}</p>
                              <p className="mt-1 text-sm text-on-surface-variant">{request.customerNote || manageCopy.empty.noNote}</p>
                            </div>
                            <PublicStatusChip tone={getToneForStatus(request.status)}>
                              {t.status.request[request.status] || request.status}
                            </PublicStatusChip>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PublicCard>
              </div>

              <PublicCard title={manageCopy.cards.availableSlots}>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <label className="block text-sm text-on-surface-variant">
                    <span className="mb-2 block font-semibold text-on-surface">{manageCopy.labels.newDate}</span>
                    <input
                      className="w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-container"
                      disabled={!booking.canRequestReschedule}
                      id="reschedule-date"
                      type="date"
                      value={selectedDate}
                      onChange={(event) => setSelectedDate(event.target.value)}
                    />
                  </label>

                  {selectedDate ? (
                    <div>
                      {loadingSlots ? (
                        <p className="text-sm text-on-surface-variant">{manageCopy.loading.slots}</p>
                      ) : !slots.length ? (
                        <div className="rounded-[1.5rem] bg-surface-container px-4 py-5 text-sm text-on-surface-variant">
                          {manageCopy.empty.noSlots}
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {slots.map((slot, index) => (
                            <button
                              key={`${slot.startTime}-${index}`}
                              type="button"
                              className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                                selectedSlot?.startTime === slot.startTime
                                  ? 'border-primary bg-primary text-on-primary'
                                  : 'border-outline-variant bg-white text-on-surface hover:border-primary hover:text-primary'
                              }`}
                              disabled={!booking.canRequestReschedule}
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {formatTime(slot.startTime)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  <label className="block text-sm text-on-surface-variant">
                    <span className="mb-2 block font-semibold text-on-surface">{manageCopy.labels.note}</span>
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-container"
                      disabled={!booking.canRequestReschedule}
                      id="customerNote"
                      placeholder={manageCopy.placeholders.note}
                      rows="4"
                      value={customerNote}
                      onChange={(event) => setCustomerNote(event.target.value)}
                    />
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={!booking.canRequestReschedule}
                    >
                      {manageCopy.actions.submit}
                    </button>
                    <Link
                      className="inline-flex rounded-full border border-outline px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
                      to="/"
                    >
                      {manageCopy.actions.returnHome}
                    </Link>
                  </div>
                </form>
              </PublicCard>
            </div>
          </div>
        ) : null}
      </section>
    </PublicPageShell>
  );
};

export default ManageBookingPage;
