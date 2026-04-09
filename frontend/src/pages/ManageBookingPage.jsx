import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import bookingService from '../services/bookingService';
import availabilityService from '../services/availabilityService';
import './BookingPage.css';

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const ManageBookingPage = () => {
  const { token } = useParams();
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
      setError(extractError(err, '无法加载预约信息'));
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
        setError(extractError(err, '无法加载可改期时间'));
      } finally {
        setLoadingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDate, booking]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedSlot) {
      setError('请选择新的预约时间');
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
      setMessage('改期申请已提交，请等待管理员审核。');
      setSelectedSlot(null);
      setCustomerNote('');
      setSelectedDate('');
      setSlots([]);
      await loadBooking();
    } catch (err) {
      setError(extractError(err, '提交改期申请失败'));
    }
  };

  if (loading) {
    return <div className="booking-page"><div className="booking-container"><div className="loading">加载中...</div></div></div>;
  }

  if (error && !booking) {
    return (
      <div className="booking-page">
        <div className="booking-container">
          <div className="error-message">{error}</div>
          <Link to="/" className="btn-primary">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1>管理预约</h1>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-banner">{message}</div>}

        <div className="booking-summary">
          <h3>当前预约</h3>
          <p><strong>客户：</strong>{booking.customerName}</p>
          <p><strong>服务：</strong>{booking.serviceName}</p>
          <p><strong>时长：</strong>{booking.durationMinutes} 分钟</p>
          <p><strong>时间：</strong>{new Date(booking.startTime).toLocaleString('zh-CN')}</p>
          <p><strong>状态：</strong>{booking.status}</p>
          <p><strong>支付状态：</strong>{booking.paymentStatus || 'pending'}</p>
          <p><strong>支持邮箱：</strong>{booking.supportEmail}</p>
        </div>

        <div className="booking-summary">
          <h3>改期说明</h3>
          <p>本页面仅支持提交改期申请，预约取消请直接联系客服。</p>
        </div>

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-group">
            <label htmlFor="reschedule-date">选择新的日期</label>
            <input
              id="reschedule-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              disabled={!booking.canRequestReschedule}
            />
          </div>

          {selectedDate && (
            <div className="time-slots">
              <h3>可改期时间</h3>
              {loadingSlots ? (
                <div className="loading">加载中...</div>
              ) : !slots.length ? (
                <p className="no-slots">当天没有可用时间</p>
              ) : (
                <div className="slots-grid">
                  {slots.map((slot, index) => (
                    <button
                      key={`${slot.startTime}-${index}`}
                      type="button"
                      className={`slot-button ${selectedSlot?.startTime === slot.startTime ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                      disabled={!booking.canRequestReschedule}
                    >
                      {new Date(slot.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="customerNote">申请备注</label>
            <textarea
              id="customerNote"
              rows="4"
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              placeholder="可补充说明为什么希望调整时间"
              disabled={!booking.canRequestReschedule}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="next-button" disabled={!booking.canRequestReschedule}>
              提交改期申请
            </button>
            <Link to="/" className="btn-secondary">返回首页</Link>
          </div>
        </form>

        <div className="booking-summary">
          <h3>历史改期申请</h3>
          {!booking.rescheduleRequests?.length ? (
            <p>暂无改期申请记录。</p>
          ) : (
            <div className="admin-list">
              {booking.rescheduleRequests.map((request) => (
                <div key={request.id} className="admin-list-item">
                  <div>
                    <strong>{new Date(request.requestedStartTime).toLocaleString('zh-CN')}</strong>
                    <p>{request.customerNote || '无客户备注'}</p>
                  </div>
                  <div className="admin-list-meta">
                    <span className={`status-chip status-${request.status}`}>{request.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageBookingPage;
