import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import bookingService from '../services/bookingService';
import './BookingConfirmationPage.css';

const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookingById(bookingId);
      setBooking(response.data);
    } catch (err) {
      setError('无法加载预约信息');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="loading">加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-container">
          <div className="error-message">{error || '预约不存在'}</div>
          <Link to="/" className="home-button">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="success-icon">✓</div>
        <h1>预约成功！</h1>
        <p className="success-message">我们已收到您的预约申请</p>

        <div className="booking-details">
          <h2>预约详情</h2>

          <div className="detail-row">
            <span className="label">预约编号：</span>
            <span className="value">#{booking.id}</span>
          </div>

          <div className="detail-row">
            <span className="label">服务项目：</span>
            <span className="value">{booking.service_name}</span>
          </div>

          <div className="detail-row">
            <span className="label">服务时长：</span>
            <span className="value">{booking.duration_minutes} 分钟</span>
          </div>

          <div className="detail-row">
            <span className="label">预约时间：</span>
            <span className="value">{formatDateTime(booking.start_time)}</span>
          </div>

          <div className="detail-row">
            <span className="label">价格：</span>
            <span className="value highlight">${booking.price}</span>
          </div>

          <div className="detail-row">
            <span className="label">状态：</span>
            <span className="value status-pending">待确认</span>
          </div>
        </div>

        <div className="customer-info">
          <h2>联系信息</h2>
          <p><strong>姓名：</strong>{booking.first_name} {booking.last_name}</p>
          <p><strong>邮箱：</strong>{booking.email}</p>
          <p><strong>电话：</strong>{booking.phone}</p>
          {booking.notes && (
            <p><strong>备注：</strong>{booking.notes}</p>
          )}
        </div>

        <div className="next-steps">
          <h2>下一步</h2>
          <ul>
            <li>我们会通过邮件发送预约确认信息</li>
            <li>请在预约时间前15分钟到达</li>
            <li>如需取消或修改预约，请联系我们</li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to="/" className="home-button">返回首页</Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
