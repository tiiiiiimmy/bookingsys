import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PublicCard from '../components/public/PublicCard';
import PublicPageShell from '../components/public/PublicPageShell';
import PublicStatusChip from '../components/public/PublicStatusChip';
import {
  BOOKING_FLOW_COPY,
  HOME_COPY,
  getLocalizedServiceContent,
} from '../content/publicSiteContent';
import usePublicLanguage from '../hooks/usePublicLanguage';
import availabilityService from '../services/availabilityService';
import bookingService from '../services/bookingService';

const SLOT_MINUTES = 30;

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const interpolate = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');

const getServiceDurationMinutes = (service) => {
  if (!service) {
    return SLOT_MINUTES;
  }

  if (Number(service.duration_minutes) > 0) {
    return Number(service.duration_minutes);
  }

  if (Number(service.durationMinutes) > 0) {
    return Number(service.durationMinutes);
  }

  const nameText = `${service.name_zh || ''} ${service.name || ''}`;
  const matched = nameText.match(/(\d+)\s*分钟/);
  if (matched) {
    return Number(matched[1]);
  }

  return SLOT_MINUTES;
};

const getMonday = (value) => {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDates = (weekStart) => {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
};

const sortSlots = (slots) => [...slots].sort((left, right) => new Date(left.startTime) - new Date(right.startTime));

const getStatusTone = (step, currentStep) => {
  if (step < currentStep) {
    return 'success';
  }

  if (step === currentStep) {
    return 'info';
  }

  return 'neutral';
};

const SummaryRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-outline-variant/60 py-3 text-sm last:border-b-0">
    <span className="text-on-surface-variant">{label}</span>
    <span className="text-right font-semibold text-on-surface">{value}</span>
  </div>
);

const PaymentCheckoutForm = ({
  bookingPayment,
  selectionSummary,
  selectedService,
  onBack,
  bookingCopy,
  serviceDisplay,
  formatMoney,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation/${bookingPayment.bookingId}`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || bookingCopy.errors.paymentFailed);
        return;
      }

      navigate(`/booking/confirmation/${bookingPayment.bookingId}`);
    } catch (err) {
      setError(err.message || bookingCopy.errors.paymentFailed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <PublicCard title={bookingCopy.cards.payment}>
        {error ? (
          <div className="mb-5 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
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
              {bookingCopy.actions.backToInfo}
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!stripe || submitting}
            >
              {submitting ? bookingCopy.actions.paying : bookingCopy.actions.payNow}
            </button>
          </div>
        </form>
      </PublicCard>

      <PublicCard title={bookingCopy.cards.paymentSummary}>
        <SummaryRow label={bookingCopy.labels.item} value={serviceDisplay.title || selectedService?.name || '-'} />
        <SummaryRow
          label={bookingCopy.labels.duration}
          value={`${selectionSummary.durationMinutes} ${serviceDisplay.durationLabel}`}
        />
        <SummaryRow label={bookingCopy.labels.time} value={selectionSummary.displayText} />
        <SummaryRow label={bookingCopy.labels.amount} value={formatMoney(selectionSummary.totalPrice)} />
      </PublicCard>
    </div>
  );
};

const PaymentStep = (props) => {
  if (!props.bookingPayment?.clientSecret || !props.stripePromise) {
    return null;
  }

  return (
    <Elements options={{ clientSecret: props.bookingPayment.clientSecret }} stripe={props.stripePromise}>
      <PaymentCheckoutForm {...props} />
    </Elements>
  );
};

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, setLanguage, t, formatMoney, formatDate, formatTime } = usePublicLanguage(BOOKING_FLOW_COPY);
  const homeCopy = HOME_COPY[language];
  const bookingCopy = t.booking;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [weekSlots, setWeekSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [bookingPayment, setBookingPayment] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);

  const selectedDurationMinutes = getServiceDurationMinutes(selectedService);
  const durationLabel = homeCopy.services.durationLabel;
  const serviceDisplay = selectedService
    ? {
        ...getLocalizedServiceContent(selectedService, language, homeCopy.services.defaultDescription),
        durationLabel,
      }
    : { title: '', description: '', durationLabel };

  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getServiceTypes();
        const loadedServices = response.data || [];
        setServiceTypes(loadedServices);

        const serviceId = Number(searchParams.get('serviceType'));
        if (serviceId) {
          const matchedService = loadedServices.find((service) => service.id === serviceId);
          if (matchedService) {
            setSelectedService(matchedService);
          }
        }
      } catch (err) {
        setError(extractError(err, bookingCopy.errors.loadServices));
      } finally {
        setLoading(false);
      }
    };

    loadServiceTypes();
  }, [bookingCopy.errors.loadServices, searchParams]);

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    const loadWeeklySlots = async () => {
      try {
        setLoadingSlots(true);
        setError('');

        const dates = getWeekDates(weekStart).map((date) => formatDateKey(date));
        const response = await availabilityService.getWeeklySlots(dates, selectedDurationMinutes);
        setWeekSlots(response);
      } catch (err) {
        setError(extractError(err, bookingCopy.errors.loadSlots));
        setWeekSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadWeeklySlots();
  }, [bookingCopy.errors.loadSlots, selectedDurationMinutes, selectedService, weekStart]);

  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedService?.id, selectedDurationMinutes]);

  const handleCustomerInfoChange = (event) => {
    const { name, value } = event.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlotToggle = (slot) => {
    setError('');
    setSelectedSlots((current) => {
      const exists = current.some((value) => value.startTime === slot.startTime);
      const next = exists
        ? current.filter((value) => value.startTime !== slot.startTime)
        : [...current, slot];
      return sortSlots(next);
    });
  };

  const handleRemoveSelectedSlot = (startTime) => {
    setSelectedSlots((current) => current.filter((slot) => slot.startTime !== startTime));
  };

  const formatSlotDateLabel = (isoDate) => {
    const date = new Date(isoDate);
    return `${formatDate(date, { month: 'numeric', day: 'numeric' })} · ${formatDate(date, { weekday: 'short' })}`;
  };

  const formatSlotTimeRange = (slot) => {
    return `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
  };

  const getSelectionSummary = () => {
    if (!selectedService || selectedSlots.length === 0) {
      return null;
    }

    const sorted = sortSlots(selectedSlots);
    const startTime = sorted[0].startTime;
    const endTime = sorted[sorted.length - 1].endTime;
    const durationMinutes = sorted.reduce((total, slot) => {
      const slotMinutes = Math.round((new Date(slot.endTime) - new Date(slot.startTime)) / (1000 * 60));
      return total + slotMinutes;
    }, 0);
    const totalPrice = Number(selectedService.price) * sorted.length;

    const displayText = sorted.length === 1
      ? `${formatDate(startTime, { month: 'numeric', day: 'numeric' })} ${formatTime(startTime)} - ${formatTime(endTime)}`
      : interpolate(bookingCopy.hints.multiSlot, { count: sorted.length });

    return {
      startTime,
      endTime,
      slotCount: sorted.length,
      slots: sorted,
      durationMinutes,
      totalPrice,
      displayText,
    };
  };

  const selectionSummary = getSelectionSummary();
  const selectedSlotsByDate = selectedSlots.reduce((acc, slot) => {
    const dateKey = slot.startTime.slice(0, 10);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const handleCreateBooking = async (event) => {
    event.preventDefault();

    if (!selectedService || !selectionSummary) {
      setError(bookingCopy.errors.chooseServiceAndTime);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await bookingService.createBooking({
        serviceTypeId: selectedService.id,
        slots: selectionSummary.slots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        customer: customerInfo,
      });

      setBookingPayment(response.data);
      setStripePromise(loadStripe(response.data.publishableKey));
      setStep(3);
    } catch (err) {
      setError(extractError(err, bookingCopy.errors.createBooking));
    } finally {
      setLoading(false);
    }
  };

  const weekDates = getWeekDates(weekStart);
  const currentWeekLabel = `${formatDate(weekDates[0], { month: 'short', day: 'numeric' })} - ${formatDate(weekDates[6], { month: 'short', day: 'numeric' })}`;
  const currentWeekMonday = getMonday(new Date());
  const canGoPrevWeek = weekStart < currentWeekMonday;

  return (
    <PublicPageShell
      language={language}
      setLanguage={setLanguage}
      brand={homeCopy.brand}
      footer={t.footer}
      navCopy={t.nav}
    >
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-4 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-4 font-label text-xs uppercase tracking-[0.3em] text-tertiary">{bookingCopy.heroTag}</p>
            <h1 className="mb-4 font-headline text-5xl leading-tight text-on-surface md:text-6xl">{bookingCopy.title}</h1>
            <p className="max-w-2xl text-lg leading-relaxed text-on-surface-variant">{bookingCopy.description}</p>
          </div>

          <PublicCard eyebrow={bookingCopy.progressTitle}>
            <div className="grid gap-3 sm:grid-cols-3">
              {bookingCopy.steps.map((label, index) => {
                const stepNumber = index + 1;
                return (
                  <div
                    key={label}
                    className={`rounded-[1.5rem] border px-4 py-4 ${
                      stepNumber === step
                        ? 'border-primary bg-primary-fixed/60'
                        : stepNumber < step
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-outline-variant/80 bg-surface-container'
                    }`}
                  >
                    <PublicStatusChip tone={getStatusTone(stepNumber, step)}>{stepNumber}</PublicStatusChip>
                    <p className="mt-3 text-sm font-semibold text-on-surface">{label}</p>
                  </div>
                );
              })}
            </div>
          </PublicCard>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-8">
        {error ? (
          <div className="mb-6 rounded-[1.5rem] bg-error-container px-5 py-4 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <PublicCard title={bookingCopy.cards.service}>
                {loading ? (
                  <p className="text-sm text-on-surface-variant">{bookingCopy.loading.services}</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {serviceTypes.map((service) => {
                      const localizedService = getLocalizedServiceContent(service, language, homeCopy.services.defaultDescription);
                      const isSelected = selectedService?.id === service.id;
                      const duration = getServiceDurationMinutes(service);

                      return (
                        <button
                          key={service.id}
                          type="button"
                          className={`rounded-[1.5rem] border p-5 text-left transition-all ${
                            isSelected
                              ? 'border-primary bg-primary-fixed/50'
                              : 'border-outline-variant/70 bg-white hover:border-primary'
                          }`}
                          onClick={() => setSelectedService(service)}
                        >
                          <div className="mb-3 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-headline text-2xl text-on-surface">{localizedService.title}</h3>
                              <p className="font-label text-xs uppercase tracking-[0.2em] text-tertiary">{localizedService.subtitle}</p>
                            </div>
                            <span className="text-base font-bold text-primary">{formatMoney(service.price)}</span>
                          </div>
                          <p className="mb-4 text-sm leading-relaxed text-on-surface-variant">{localizedService.description}</p>
                          <div className="flex items-center justify-between text-sm text-on-surface-variant">
                            <span>{`${duration} ${durationLabel}`}</span>
                            {isSelected ? <PublicStatusChip tone="info">{bookingCopy.cards.serviceSelected}</PublicStatusChip> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </PublicCard>

              <div className="space-y-6">
                {selectedService ? (
                  <PublicCard title={bookingCopy.cards.serviceSelected}>
                    <h3 className="font-headline text-3xl text-on-surface">{serviceDisplay.title}</h3>
                    <p className="mt-2 text-sm uppercase tracking-[0.2em] text-tertiary">{serviceDisplay.subtitle}</p>
                    <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{serviceDisplay.description}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <PublicStatusChip tone="info">{formatMoney(selectedService.price)}</PublicStatusChip>
                      <PublicStatusChip tone="neutral">{`${selectedDurationMinutes} ${durationLabel}`}</PublicStatusChip>
                    </div>
                  </PublicCard>
                ) : null}

                <PublicCard eyebrow={bookingCopy.progressTitle} title={bookingCopy.cards.summary}>
                  {selectionSummary ? (
                    <>
                      <SummaryRow label={bookingCopy.labels.item} value={serviceDisplay.title} />
                      <SummaryRow label={bookingCopy.labels.time} value={selectionSummary.displayText} />
                      <SummaryRow label={bookingCopy.labels.slotCount} value={String(selectionSummary.slotCount)} />
                      <SummaryRow label={bookingCopy.labels.duration} value={`${selectionSummary.durationMinutes} ${durationLabel}`} />
                      <SummaryRow label={bookingCopy.labels.amount} value={formatMoney(selectionSummary.totalPrice)} />
                    </>
                  ) : (
                    <p className="text-sm leading-relaxed text-on-surface-variant">{bookingCopy.errors.chooseServiceAndTime}</p>
                  )}
                </PublicCard>
              </div>
            </div>

            {selectedService ? (
              <PublicCard title={bookingCopy.cards.availability}>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant">
                    {interpolate(bookingCopy.hints.durationWindow, { duration: selectedDurationMinutes })}
                  </p>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="rounded-full border border-outline px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={!canGoPrevWeek}
                      onClick={() => {
                        const next = new Date(weekStart);
                        next.setDate(weekStart.getDate() - 7);
                        setWeekStart(next);
                      }}
                    >
                      {bookingCopy.actions.previousWeek}
                    </button>
                    <span className="text-sm font-semibold text-on-surface">{currentWeekLabel}</span>
                    <button
                      type="button"
                      className="rounded-full border border-outline px-4 py-2 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
                      onClick={() => {
                        const next = new Date(weekStart);
                        next.setDate(weekStart.getDate() + 7);
                        setWeekStart(next);
                      }}
                    >
                      {bookingCopy.actions.nextWeek}
                    </button>
                  </div>
                </div>

                {loadingSlots ? (
                  <p className="text-sm text-on-surface-variant">{bookingCopy.loading.weeklySlots}</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                    {weekDates.map((date) => {
                      const dateKey = formatDateKey(date);
                      const dayData = weekSlots.find((entry) => entry.date === dateKey);
                      return (
                        <div key={dateKey} className="rounded-[1.5rem] border border-outline-variant/70 bg-surface-container-low p-4">
                          <div className="mb-4 border-b border-outline-variant/60 pb-3">
                            <p className="font-semibold text-on-surface">{formatDate(date, { weekday: 'short' })}</p>
                            <p className="text-sm text-on-surface-variant">{formatDate(date, { month: 'numeric', day: 'numeric' })}</p>
                          </div>

                          <div className="flex flex-col gap-2">
                            {!dayData?.slots?.length ? (
                              <p className="rounded-2xl bg-white px-3 py-4 text-sm leading-relaxed text-on-surface-variant">
                                {interpolate(bookingCopy.empty.noSlots, { duration: selectedDurationMinutes })}
                              </p>
                            ) : (
                              dayData.slots.map((slot, slotIndex) => {
                                const selected = selectedSlots.some((value) => value.startTime === slot.startTime);
                                return (
                                  <button
                                    key={`${slot.startTime}-${slotIndex}`}
                                    type="button"
                                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                                      selected
                                        ? 'border-primary bg-primary text-on-primary'
                                        : 'border-outline-variant bg-white text-on-surface hover:border-primary hover:text-primary'
                                    }`}
                                    onClick={() => handleSlotToggle(slot)}
                                  >
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </PublicCard>
            ) : null}

            {selectedSlots.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                <PublicCard title={bookingCopy.cards.selectedSlots}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.keys(selectedSlotsByDate).sort().map((dateKey) => (
                      <div key={dateKey} className="rounded-[1.5rem] border border-outline-variant/60 bg-white p-4">
                        <p className="mb-3 font-semibold text-on-surface">{formatSlotDateLabel(dateKey)}</p>
                        <div className="space-y-2">
                          {sortSlots(selectedSlotsByDate[dateKey]).map((slot) => {
                            const ariaLabel = interpolate(bookingCopy.aria.removeSlot, {
                              date: formatSlotDateLabel(dateKey),
                              time: formatSlotTimeRange(slot),
                            });

                            return (
                              <div
                                key={slot.startTime}
                                className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container px-4 py-3"
                              >
                                <span className="text-sm font-semibold text-on-surface">{formatSlotTimeRange(slot)}</span>
                                <button
                                  type="button"
                                  aria-label={ariaLabel}
                                  className="h-8 w-8 rounded-full bg-rose-100 text-sm font-bold text-rose-700 transition-colors hover:bg-rose-200"
                                  onClick={() => handleRemoveSelectedSlot(slot.startTime)}
                                  title={ariaLabel}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </PublicCard>

                <div className="flex items-end">
                  <button
                    type="button"
                    className="rounded-full bg-primary px-8 py-4 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container"
                    onClick={() => setStep(2)}
                  >
                    {bookingCopy.actions.next}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === 2 && selectionSummary ? (
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <PublicCard title={bookingCopy.cards.summary}>
              <SummaryRow label={bookingCopy.labels.item} value={serviceDisplay.title} />
              <SummaryRow label={bookingCopy.labels.time} value={selectionSummary.displayText} />
              <SummaryRow label={bookingCopy.labels.slotCount} value={String(selectionSummary.slotCount)} />
              <SummaryRow label={bookingCopy.labels.duration} value={`${selectionSummary.durationMinutes} ${durationLabel}`} />
              <SummaryRow label={bookingCopy.labels.totalPrice} value={formatMoney(selectionSummary.totalPrice)} />

              <div className="mt-6 rounded-[1.5rem] bg-primary-fixed/40 px-4 py-4 text-sm leading-relaxed text-on-surface-variant">
                {bookingCopy.hints.payment}
              </div>
            </PublicCard>

            <PublicCard title={bookingCopy.cards.contact}>
              <form className="space-y-5" onSubmit={handleCreateBooking}>
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm text-on-surface-variant">
                    <span className="mb-2 block font-semibold text-on-surface">{bookingCopy.labels.firstName}</span>
                    <input
                      className="w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
                      id="firstName"
                      name="firstName"
                      required
                      type="text"
                      value={customerInfo.firstName}
                      onChange={handleCustomerInfoChange}
                    />
                  </label>

                  <label className="block text-sm text-on-surface-variant">
                    <span className="mb-2 block font-semibold text-on-surface">{bookingCopy.labels.lastName}</span>
                    <input
                      className="w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
                      id="lastName"
                      name="lastName"
                      required
                      type="text"
                      value={customerInfo.lastName}
                      onChange={handleCustomerInfoChange}
                    />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm text-on-surface-variant">
                    <span className="mb-2 block font-semibold text-on-surface">{bookingCopy.labels.email}</span>
                    <input
                      className="w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
                      id="email"
                      name="email"
                      required
                      type="email"
                      value={customerInfo.email}
                      onChange={handleCustomerInfoChange}
                    />
                  </label>

                  <label className="block text-sm text-on-surface-variant">
                    <span className="mb-2 block font-semibold text-on-surface">{bookingCopy.labels.phone}</span>
                    <input
                      className="w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
                      id="phone"
                      name="phone"
                      required
                      type="tel"
                      value={customerInfo.phone}
                      onChange={handleCustomerInfoChange}
                    />
                  </label>
                </div>

                <label className="block text-sm text-on-surface-variant">
                  <span className="mb-2 block font-semibold text-on-surface">{bookingCopy.labels.notes}</span>
                  <textarea
                    className="min-h-28 w-full rounded-2xl border border-outline-variant bg-white px-4 py-3 text-on-surface outline-none transition-colors focus:border-primary"
                    id="notes"
                    name="notes"
                    placeholder={bookingCopy.placeholders.notes}
                    rows="4"
                    value={customerInfo.notes}
                    onChange={handleCustomerInfoChange}
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-outline px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
                    onClick={() => setStep(1)}
                  >
                    {bookingCopy.actions.backToTime}
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? bookingCopy.actions.creating : bookingCopy.actions.toPayment}
                  </button>
                </div>
              </form>
            </PublicCard>
          </div>
        ) : null}

        {step === 3 && selectionSummary ? (
          <PaymentStep
            bookingCopy={bookingCopy}
            bookingPayment={bookingPayment}
            formatMoney={formatMoney}
            onBack={() => setStep(2)}
            selectedService={selectedService}
            selectionSummary={selectionSummary}
            serviceDisplay={serviceDisplay}
            stripePromise={stripePromise}
          />
        ) : null}

        <div className="mt-10">
          <button
            type="button"
            className="rounded-full border border-outline px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary"
            onClick={() => navigate('/')}
          >
            {bookingCopy.actions.returnHome}
          </button>
        </div>
      </section>
    </PublicPageShell>
  );
};

export default BookingPage;
