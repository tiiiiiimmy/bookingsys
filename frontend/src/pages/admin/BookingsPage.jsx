import React, { useEffect, useState } from 'react';
import { getAdminBookingStatusBadges, getAdminStatusLabel } from '../../content/adminContent';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import adminService from '../../services/adminService';
import {
  adminButtonDangerClass,
  adminButtonPrimaryClass,
  adminButtonSuccessClass,
  adminButtonWarningClass,
  adminDetailCardClass,
  adminDetailGridClass,
  adminEmptyStateClass,
  adminFieldLabelClass,
  adminFieldValueClass,
  adminGridClass,
  adminInputClass,
  adminListButtonClass,
  adminListClass,
  adminPageTitleClass,
  adminPanelClass,
  adminPanelHeaderClass,
  adminSectionStackClass,
  adminSubsectionTitleClass,
  getAdminAlertClass,
  getAdminStatusChipClass,
} from '../../components/admin/adminStyles';

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const renderStatusBadges = (copy, status) => (
  <div className="flex flex-wrap items-center gap-2">
    {getAdminBookingStatusBadges(copy, status).map((badge) => (
      <span
        key={`${status}-${badge.tone}-${badge.label}`}
        className={getAdminStatusChipClass(badge.tone)}
      >
        {badge.label}
      </span>
    ))}
  </div>
);

const BookingsPage = () => {
  const { t, formatDateTime, formatMoney } = useAdminLanguage();
  const [bookings, setBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    search: '',
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    startTime: '',
    endTime: '',
    adminNote: '',
  });

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
      const response = await adminService.getBookings(params);
      setBookings(response.data || []);

      if (response.data?.length) {
        const stillExists = response.data.some((booking) => booking.id === selectedBookingId);
        if (!stillExists) {
          setSelectedBookingId(response.data[0].id);
        }
      } else {
        setSelectedBookingId(null);
      }
    } catch (err) {
      setError(extractError(err, t.bookings.loadListError));
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (bookingId) => {
    if (!bookingId) {
      setSelectedBooking(null);
      return;
    }

    try {
      setDetailLoading(true);
      setError('');
      const response = await adminService.getBookingById(bookingId);
      setSelectedBooking(response.data);
    } catch (err) {
      setError(extractError(err, t.bookings.loadDetailError));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [t.bookings.loadListError]);

  useEffect(() => {
    loadDetail(selectedBookingId);
  }, [selectedBookingId]);

  const handleStatusUpdate = async (status) => {
    try {
      setError('');
      setMessage('');
      await adminService.updateBookingStatus(selectedBookingId, {
        status,
        cancellationReason: status === 'cancelled' ? t.bookings.adminCancelledReason : null,
      });
      setMessage(t.bookings.updateSuccess);
      await loadBookings();
      await loadDetail(selectedBookingId);
    } catch (err) {
      setError(extractError(err, t.bookings.updateFailed));
    }
  };

  const handleReschedule = async (event) => {
    event.preventDefault();

    try {
      setError('');
      setMessage('');
      await adminService.rescheduleBooking(selectedBookingId, rescheduleForm);
      setMessage(t.bookings.rescheduleSuccess);
      setRescheduleForm({ startTime: '', endTime: '', adminNote: '' });
      await loadBookings();
      await loadDetail(selectedBookingId);
    } catch (err) {
      setError(extractError(err, t.bookings.rescheduleFailed));
    }
  };

  const handleReviewRequest = async (requestId, action) => {
    const adminNote = window.prompt(
      action === 'approve' ? t.bookings.requests.approvePrompt : t.bookings.requests.rejectPrompt,
      ''
    ) || '';

    try {
      setError('');
      setMessage('');
      if (action === 'approve') {
        await adminService.approveRescheduleRequest(requestId, adminNote);
      } else {
        await adminService.rejectRescheduleRequest(requestId, adminNote);
      }
      setMessage(action === 'approve' ? t.bookings.reviewApproveSuccess : t.bookings.reviewRejectSuccess);
      await loadBookings();
      await loadDetail(selectedBookingId);
    } catch (err) {
      setError(extractError(err, t.bookings.reviewFailed));
    }
  };

  const renderStatusActions = () => {
    if (!selectedBooking) {
      return null;
    }

    switch (selectedBooking.status) {
      case 'pending':
        return (
          <>
            <button className={adminButtonSuccessClass} type="button" onClick={() => handleStatusUpdate('confirmed')}>
              {t.bookings.actions.confirmBooking}
            </button>
            <button className={adminButtonDangerClass} type="button" onClick={() => handleStatusUpdate('cancelled')}>
              {t.bookings.actions.cancelBooking}
            </button>
          </>
        );
      case 'confirmed':
        return (
          <>
            <button className={adminButtonSuccessClass} type="button" onClick={() => handleStatusUpdate('arrived')}>
              {t.bookings.actions.confirmArrival}
            </button>
            <button className={adminButtonWarningClass} type="button" onClick={() => handleStatusUpdate('no_show')}>
              {t.bookings.actions.markNoShow}
            </button>
            <button className={adminButtonDangerClass} type="button" onClick={() => handleStatusUpdate('cancelled')}>
              {t.bookings.actions.cancelBooking}
            </button>
          </>
        );
      case 'arrived':
        return (
          <>
            <button className={adminButtonSuccessClass} type="button" onClick={() => handleStatusUpdate('completed')}>
              {t.bookings.actions.markCompleted}
            </button>
            <button className={adminButtonWarningClass} type="button" onClick={() => handleStatusUpdate('no_show')}>
              {t.bookings.actions.markNoShow}
            </button>
          </>
        );
      case 'no_show':
        return (
          <button className={adminButtonSuccessClass} type="button" onClick={() => handleStatusUpdate('arrived')}>
            {t.bookings.actions.confirmArrival}
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={adminGridClass}>
      <section className={adminPanelClass}>
        <div className={adminPanelHeaderClass}>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-tertiary">{t.layout.bookings}</p>
            <h1 className={`mt-3 ${adminPageTitleClass}`}>{t.bookings.title}</h1>
          </div>
        </div>

        {error ? <div className={`${getAdminAlertClass('error')} mb-5`}>{error}</div> : null}
        {message ? <div className={`${getAdminAlertClass('success')} mb-5`}>{message}</div> : null}

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <input
            className={adminInputClass}
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
          />
          <input
            className={adminInputClass}
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
          />
          <select
            className={adminInputClass}
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            <option value="">{t.bookings.filters.allStatuses}</option>
            <option value="pending">{getAdminStatusLabel(t, 'pending')}</option>
            <option value="confirmed">{getAdminStatusLabel(t, 'confirmed')}</option>
            <option value="arrived">{getAdminStatusLabel(t, 'arrived')}</option>
            <option value="completed">{getAdminStatusLabel(t, 'completed')}</option>
            <option value="cancelled">{getAdminStatusLabel(t, 'cancelled')}</option>
            <option value="no_show">{getAdminStatusLabel(t, 'no_show')}</option>
            <option value="expired">{getAdminStatusLabel(t, 'expired')}</option>
          </select>
          <input
            className={adminInputClass}
            placeholder={t.bookings.filters.searchPlaceholder}
            type="text"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <button className={adminButtonPrimaryClass} type="button" onClick={loadBookings}>
            {t.bookings.filters.search}
          </button>
        </div>

        {loading ? (
          <p className={adminEmptyStateClass}>{t.common.loading}</p>
        ) : !bookings.length ? (
          <p className={adminEmptyStateClass}>{t.bookings.empty}</p>
        ) : (
          <div className={adminListClass}>
            {bookings.map((booking) => {
              const isSelected = selectedBookingId === booking.id;

              return (
                <button
                  key={booking.id}
                  className={`${adminListButtonClass} ${
                    isSelected ? 'border-primary bg-primary-fixed/20 ring-2 ring-primary-fixed' : ''
                  }`}
                  type="button"
                  onClick={() => setSelectedBookingId(booking.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-on-surface">
                        #{booking.id} {booking.customerName}
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">{booking.serviceName}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{formatDateTime(booking.startTime)}</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {renderStatusBadges(t, booking.status)}
                      <span className={getAdminStatusChipClass(booking.paymentStatus || 'pending')}>
                        {getAdminStatusLabel(t, booking.paymentStatus || 'pending')}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className={`${adminPanelClass} ${adminSectionStackClass}`}>
        <div className={adminPanelHeaderClass}>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tertiary">{t.bookings.detailTitle}</p>
            <h2 className="mt-2 font-headline text-2xl text-on-surface">{t.bookings.detailTitle}</h2>
          </div>
        </div>

        {detailLoading ? (
          <p className={adminEmptyStateClass}>{t.common.loadingDetails}</p>
        ) : !selectedBooking ? (
          <p className={adminEmptyStateClass}>{t.bookings.selectHint}</p>
        ) : (
          <>
            <div className={adminDetailGridClass}>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.bookingId}</p>
                <p className={adminFieldValueClass}>#{selectedBooking.id}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.customer}</p>
                <p className={adminFieldValueClass}>{selectedBooking.customerName}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.email}</p>
                <p className={adminFieldValueClass}>{selectedBooking.customerEmail}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.phone}</p>
                <p className={adminFieldValueClass}>{selectedBooking.customerPhone}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.service}</p>
                <p className={adminFieldValueClass}>{selectedBooking.serviceName}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.duration}</p>
                <p className={adminFieldValueClass}>
                  {selectedBooking.durationMinutes} {t.common.minuteUnit}
                </p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.time}</p>
                <p className={adminFieldValueClass}>{formatDateTime(selectedBooking.startTime)}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.price}</p>
                <p className={adminFieldValueClass}>{formatMoney(selectedBooking.price)}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.bookingStatus}</p>
                <div className="mt-2">{renderStatusBadges(t, selectedBooking.status)}</div>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.paymentStatus}</p>
                <p className={adminFieldValueClass}>
                  {getAdminStatusLabel(t, selectedBooking.paymentStatus || 'pending')}
                </p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.paymentIntent}</p>
                <p className={adminFieldValueClass}>{selectedBooking.stripePaymentIntentId || '-'}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.bookings.fields.manageToken}</p>
                <p className={adminFieldValueClass}>{selectedBooking.manageToken || '-'}</p>
              </div>
            </div>

            {selectedBooking.notes ? (
              <div className="rounded-[1.5rem] border border-outline/20 bg-primary-fixed/20 px-5 py-4">
                <p className={adminFieldLabelClass}>{t.bookings.notes}</p>
                <p className="mt-2 text-sm leading-relaxed text-on-surface">{selectedBooking.notes}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">{renderStatusActions()}</div>

            <form className="space-y-4 rounded-[1.5rem] border border-outline/20 bg-surface-container-low px-5 py-5" onSubmit={handleReschedule}>
              <h3 className={adminSubsectionTitleClass}>{t.bookings.reschedule.title}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  aria-label={t.bookings.reschedule.startTime}
                  className={adminInputClass}
                  required
                  type="datetime-local"
                  value={rescheduleForm.startTime}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, startTime: event.target.value }))}
                />
                <input
                  aria-label={t.bookings.reschedule.endTime}
                  className={adminInputClass}
                  required
                  type="datetime-local"
                  value={rescheduleForm.endTime}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, endTime: event.target.value }))}
                />
              </div>
              <input
                className={adminInputClass}
                placeholder={t.bookings.reschedule.adminNote}
                type="text"
                value={rescheduleForm.adminNote}
                onChange={(event) => setRescheduleForm((prev) => ({ ...prev, adminNote: event.target.value }))}
              />
              <button className={adminButtonPrimaryClass} type="submit">
                {t.bookings.actions.submitReschedule}
              </button>
            </form>

            <div>
              <h3 className={adminSubsectionTitleClass}>{t.bookings.requests.title}</h3>
              {!selectedBooking.rescheduleRequests?.length ? (
                <p className={adminEmptyStateClass}>{t.bookings.requests.empty}</p>
              ) : (
                <div className={adminListClass}>
                  {selectedBooking.rescheduleRequests.map((request) => (
                    <div key={request.id} className={adminListButtonClass}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-on-surface">
                            {formatDateTime(request.requestedStartTime)}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant">
                            {request.customerNote || t.bookings.requests.noCustomerNote}
                          </p>
                          {request.adminNote ? (
                            <p className="mt-1 text-sm text-on-surface-variant">{request.adminNote}</p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <span className={getAdminStatusChipClass(request.status)}>
                            {getAdminStatusLabel(t, request.status)}
                          </span>
                          {request.status === 'pending' ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                className={adminButtonSuccessClass}
                                type="button"
                                onClick={() => handleReviewRequest(request.id, 'approve')}
                              >
                                {t.bookings.actions.approve}
                              </button>
                              <button
                                className={adminButtonDangerClass}
                                type="button"
                                onClick={() => handleReviewRequest(request.id, 'reject')}
                              >
                                {t.bookings.actions.reject}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default BookingsPage;
