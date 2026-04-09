import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const BookingsPage = () => {
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
      setError(extractError(err, '无法加载预约列表'));
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
      setError(extractError(err, '无法加载预约详情'));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    loadDetail(selectedBookingId);
  }, [selectedBookingId]);

  const handleStatusUpdate = async (status) => {
    try {
      setError('');
      await adminService.updateBookingStatus(selectedBookingId, {
        status,
        cancellationReason: status === 'cancelled' ? '管理员取消预约' : null,
      });
      setMessage('预约状态已更新');
      await loadBookings();
      await loadDetail(selectedBookingId);
    } catch (err) {
      setError(extractError(err, '更新预约状态失败'));
    }
  };

  const handleReschedule = async (event) => {
    event.preventDefault();

    try {
      setError('');
      await adminService.rescheduleBooking(selectedBookingId, rescheduleForm);
      setMessage('预约已改期');
      setRescheduleForm({ startTime: '', endTime: '', adminNote: '' });
      await loadBookings();
      await loadDetail(selectedBookingId);
    } catch (err) {
      setError(extractError(err, '改期失败'));
    }
  };

  const handleReviewRequest = async (requestId, action) => {
    const adminNote = window.prompt(action === 'approve' ? '审核备注（可选）' : '拒绝原因（可选）', '') || '';

    try {
      setError('');
      if (action === 'approve') {
        await adminService.approveRescheduleRequest(requestId, adminNote);
      } else {
        await adminService.rejectRescheduleRequest(requestId, adminNote);
      }
      setMessage(action === 'approve' ? '改期申请已批准' : '改期申请已拒绝');
      await loadBookings();
      await loadDetail(selectedBookingId);
    } catch (err) {
      setError(extractError(err, '处理改期申请失败'));
    }
  };

  return (
    <div className="admin-two-column">
      <section className="admin-panel">
        <div className="section-header">
          <h1>预约管理</h1>
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
            <option value="">全部状态</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="no_show">no_show</option>
            <option value="expired">expired</option>
          </select>
          <input
            type="text"
            placeholder="搜索客户 / 邮箱 / 电话"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <button type="button" className="btn-primary" onClick={loadBookings}>
            搜索
          </button>
        </div>

        {loading ? (
          <p className="empty-state">加载中...</p>
        ) : !bookings.length ? (
          <p className="empty-state">暂无符合条件的预约</p>
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
                  <p>{new Date(booking.startTime).toLocaleString('zh-CN')}</p>
                </div>
                <div className="admin-list-meta">
                  <span className={`status-chip status-${booking.status}`}>{booking.status}</span>
                  <span className={`status-chip status-${booking.paymentStatus || 'pending'}`}>
                    {booking.paymentStatus || 'pending'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="section-header">
          <h2>预约详情</h2>
        </div>

        {detailLoading ? (
          <p className="empty-state">加载详情中...</p>
        ) : !selectedBooking ? (
          <p className="empty-state">请选择左侧预约查看详情</p>
        ) : (
          <>
            <div className="detail-grid">
              <div><strong>预约编号</strong><p>#{selectedBooking.id}</p></div>
              <div><strong>客户</strong><p>{selectedBooking.customerName}</p></div>
              <div><strong>邮箱</strong><p>{selectedBooking.customerEmail}</p></div>
              <div><strong>电话</strong><p>{selectedBooking.customerPhone}</p></div>
              <div><strong>服务</strong><p>{selectedBooking.serviceName}</p></div>
              <div><strong>时长</strong><p>{selectedBooking.durationMinutes} 分钟</p></div>
              <div><strong>时间</strong><p>{new Date(selectedBooking.startTime).toLocaleString('zh-CN')}</p></div>
              <div><strong>价格</strong><p>${selectedBooking.price}</p></div>
              <div><strong>预约状态</strong><p>{selectedBooking.status}</p></div>
              <div><strong>支付状态</strong><p>{selectedBooking.paymentStatus || 'pending'}</p></div>
              <div><strong>Payment Intent</strong><p>{selectedBooking.stripePaymentIntentId || '-'}</p></div>
              <div><strong>管理令牌</strong><p className="truncate-text">{selectedBooking.manageToken || '-'}</p></div>
            </div>

            {selectedBooking.notes && (
              <div className="note-box">
                <strong>客户备注</strong>
                <p>{selectedBooking.notes}</p>
              </div>
            )}

            <div className="button-row">
              <button type="button" className="btn-secondary" onClick={() => handleStatusUpdate('confirmed')}>标记 confirmed</button>
              <button type="button" className="btn-secondary" onClick={() => handleStatusUpdate('completed')}>标记 completed</button>
              <button type="button" className="btn-secondary" onClick={() => handleStatusUpdate('no_show')}>标记 no_show</button>
              <button type="button" className="btn-danger" onClick={() => handleStatusUpdate('cancelled')}>取消预约</button>
            </div>

            <form onSubmit={handleReschedule} className="admin-form-section">
              <h3>管理员直接改期</h3>
              <div className="filter-grid">
                <input
                  type="datetime-local"
                  value={rescheduleForm.startTime}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, startTime: event.target.value }))}
                  required
                />
                <input
                  type="datetime-local"
                  value={rescheduleForm.endTime}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, endTime: event.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="管理员备注（可选）"
                  value={rescheduleForm.adminNote}
                  onChange={(event) => setRescheduleForm((prev) => ({ ...prev, adminNote: event.target.value }))}
                />
                <button type="submit" className="btn-primary">提交改期</button>
              </div>
            </form>

            <div className="admin-form-section">
              <h3>改期申请</h3>
              {!selectedBooking.rescheduleRequests?.length ? (
                <p className="empty-state">暂无改期申请</p>
              ) : (
                <div className="admin-list">
                  {selectedBooking.rescheduleRequests.map((request) => (
                    <div key={request.id} className="admin-list-item">
                      <div>
                        <strong>{new Date(request.requestedStartTime).toLocaleString('zh-CN')}</strong>
                        <p>{request.customerNote || '无客户备注'}</p>
                        <p>{request.adminNote || ''}</p>
                      </div>
                      <div className="admin-list-meta">
                        <span className={`status-chip status-${request.status}`}>{request.status}</span>
                        {request.status === 'pending' && (
                          <div className="button-row compact">
                            <button type="button" className="btn-primary" onClick={() => handleReviewRequest(request.id, 'approve')}>
                              批准
                            </button>
                            <button type="button" className="btn-danger" onClick={() => handleReviewRequest(request.id, 'reject')}>
                              拒绝
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
