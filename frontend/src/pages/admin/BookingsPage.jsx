import React, { useEffect, useState } from 'react';
import { getAdminBookingStatusBadges, getAdminStatusLabel } from '../../content/adminContent';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import adminService from '../../services/adminService';

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const renderStatusBadges = (copy, status) => (
  <div className="status-badge-group">
    {getAdminBookingStatusBadges(copy, status).map((badge) => (
      <span key={`${status}-${badge.tone}-${badge.label}`} className={`status-chip status-${badge.tone}`}>
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
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );
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
            <button type="button" className="btn-status btn-status-confirmed" onClick={() => handleStatusUpdate('confirmed')}>
              {t.bookings.actions.confirmBooking}
            </button>
            <button type="button" className="btn-danger" onClick={() => handleStatusUpdate('cancelled')}>
              {t.bookings.actions.cancelBooking}
            </button>
          </>
        );
      case 'confirmed':
        return (
          <>
            <button type="button" className="btn-status btn-status-confirmed" onClick={() => handleStatusUpdate('arrived')}>
              {t.bookings.actions.confirmArrival}
            </button>
            <button type="button" className="btn-status btn-status-no-show" onClick={() => handleStatusUpdate('no_show')}>
              {t.bookings.actions.markNoShow}
            </button>
            <button type="button" className="btn-danger" onClick={() => handleStatusUpdate('cancelled')}>
              {t.bookings.actions.cancelBooking}
            </button>
          </>
        );
      case 'arrived':
        return (
          <>
            <button type="button" className="btn-status btn-status-completed" onClick={() => handleStatusUpdate('completed')}>
              {t.bookings.actions.markCompleted}
            </button>
            <button type="button" className="btn-status btn-status-no-show" onClick={() => handleStatusUpdate('no_show')}>
              {t.bookings.actions.markNoShow}
            </button>
          </>
        );
      case 'no_show':
        return (
          <>
            <button type="button" className="btn-status btn-status-confirmed" onClick={() => handleStatusUpdate('arrived')}>
              {t.bookings.actions.confirmArrival}
            </button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-two-column">
      <section className="admin-panel">
        <div className="section-header">
          <h1>{t.bookings.title}</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="filter-grid">
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
          />
          <select
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
            type="text"
            placeholder={t.bookings.filters.searchPlaceholder}
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <button type="button" className="btn-primary" onClick={loadBookings}>
            {t.bookings.filters.search}
          </button>
        </div>

        {loading ? (
          <p className="empty-state">{t.common.loading}</p>
        ) : !bookings.length ? (
          <p className="empty-state">{t.bookings.empty}</p>
        ) : (
          <div className="admin-list">
            {bookings.map((booking) => (
              <button
                type="button"
                key={booking.id}
                className={`admin-list-item admin-list-button ${selectedBookingId === booking.id ? 'selected' : ''}`}
                onClick={() => setSelectedBookingId(booking.id)}
              >
                <div>
                  <strong>#{booking.id} {booking.customerName}</strong>
                  <p>{booking.serviceName}</p>
                  <p>{formatDateTime(booking.startTime)}</p>
                </div>
                <div className="admin-list-meta">
                  {renderStatusBadges(t, booking.status)}
                  <span className={`status-chip status-${booking.paymentStatus || 'pending'}`}>
                    {getAdminStatusLabel(t, booking.paymentStatus || 'pending')}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="section-header">
          <h2>{t.bookings.detailTitle}</h2>
        </div>

        {detailLoading ? (
          <p className="empty-state">{t.common.loadingDetails}</p>
        ) : !selectedBooking ? (
          <p className="empty-state">{t.bookings.selectHint}</p>
        ) : (
          <>
            <div className="detail-grid">
              <div><strong>{t.bookings.fields.bookingId}</strong><p>#{selectedBooking.id}</p></div>
              <div><strong>{t.bookings.fields.customer}</strong><p>{selectedBooking.customerName}</p></div>
              <div><strong>{t.bookings.fields.email}</strong><p>{selectedBooking.customerEmail}</p></div>
              <div><strong>{t.bookings.fields.phone}</strong><p>{selectedBooking.customerPhone}</p></div>
              <div><strong>{t.bookings.fields.service}</strong><p>{selectedBooking.serviceName}</p></div>
              <div><strong>{t.bookings.fields.duration}</strong><p>{selectedBooking.durationMinutes} {t.common.minuteUnit}</p></div>
              <div><strong>{t.bookings.fields.time}</strong><p>{formatDateTime(selectedBooking.startTime)}</p></div>
              <div><strong>{t.bookings.fields.price}</strong><p>{formatMoney(selectedBooking.price)}</p></div>
              <div><strong>{t.bookings.fields.bookingStatus}</strong>{renderStatusBadges(t, selectedBooking.status)}</div>
              <div><strong>{t.bookings.fields.paymentStatus}</strong><p>{getAdminStatusLabel(t, selectedBooking.paymentStatus || 'pending')}</p></div>
              <div><strong>{t.bookings.fields.paymentIntent}</strong><p>{selectedBooking.stripePaymentIntentId || '-'}</p></div>
              <div><strong>{t.bookings.fields.manageToken}</strong><p className="truncate-text">{selectedBooking.manageToken || '-'}</p></div>
            </div>

            {selectedBooking.notes && (
              <div className="note-box">
                <strong>{t.bookings.notes}</strong>
                <p>{selectedBooking.notes}</p>
              </div>
            )}

            <div className="button-row">
              {renderStatusActions()}
            </div>

            <form onSubmit={handleReschedule} className="admin-form-section">
              <h3>{t.bookings.reschedule.title}</h3>
              <div className="filter-grid">
                <input
                  aria-label={t.bookings.reschedule.startTime}
                  type="datetime-local"
                  value={rescheduleForm.startTime}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  required
                />
                <input
                  aria-label={t.bookings.reschedule.endTime}
                  type="datetime-local"
                  value={rescheduleForm.endTime}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, endTime: event.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder={t.bookings.reschedule.adminNote}
                  value={rescheduleForm.adminNote}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, adminNote: event.target.value }))}
                />
                <button type="submit" className="btn-primary">{t.bookings.actions.submitReschedule}</button>
              </div>
            </form>

            <div className="admin-form-section">
              <h3>{t.bookings.requests.title}</h3>
              {!selectedBooking.rescheduleRequests?.length ? (
                <p className="empty-state">{t.bookings.requests.empty}</p>
              ) : (
                <div className="admin-list">
                  {selectedBooking.rescheduleRequests.map((request) => (
                    <div key={request.id} className="admin-list-item">
                      <div>
                        <strong>{formatDateTime(request.requestedStartTime)}</strong>
                        <p>{request.customerNote || t.bookings.requests.noCustomerNote}</p>
                        <p>{request.adminNote || ''}</p>
                      </div>
                      <div className="admin-list-meta">
                        <span className={`status-chip status-${request.status}`}>{getAdminStatusLabel(t, request.status)}</span>
                        {request.status === 'pending' && (
                          <div className="button-row compact">
                            <button type="button" className="btn-primary" onClick={() => handleReviewRequest(request.id, 'approve')}>
                              {t.bookings.actions.approve}
                            </button>
                            <button type="button" className="btn-danger" onClick={() => handleReviewRequest(request.id, 'reject')}>
                              {t.bookings.actions.reject}
                            </button>
                          </div>
                        )}
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
