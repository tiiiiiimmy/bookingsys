import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import bookingService from '../services/bookingService';
import './BookingConfirmationPage.css';

const statusText = {
  pending: '待支付确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
  no_show: '未到店',
  expired: '已过期',
};

const paymentStatusText = {
  pending: '待支付',
  failed: '支付失败',
  succeeded: '支付成功',
  refunded: '已退款',
  partially_refunded: '部分退款',
};

const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
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

        if (!loading) {
          setLoading(false);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err.response?.data?.error?.message || '无法加载预约信息');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBooking();
    intervalId = window.setInterval(() => {
      loadBooking();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [bookingId]);

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

  const renderHeading = () => {
    if (!booking) {
      return { title: '预约处理中', message: '我们正在同步支付和预约状态。' };
    }

    if (booking.status === 'confirmed') {
      return { title: '预约已确认', message: '支付成功，预约已经正式确认。' };
    }

    if (booking.status === 'expired') {
      return { title: '预约已过期', message: '预约保留已超时，请重新选择时间并完成支付。' };
    }

    if (booking.payment_status === 'failed') {
      return { title: '支付未完成', message: '支付未成功完成，预约暂未确认。' };
    }

    if (booking.status === 'cancelled') {
      return { title: '预约已取消', message: '该预约目前处于已取消状态。' };
    }

    return { title: '预约处理中', message: '支付完成后，系统会自动确认预约。' };
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

  const heading = renderHeading();

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className={`success-icon ${booking.status !== 'confirmed' ? 'pending-icon' : ''}`}>
          {booking.status === 'confirmed' ? '✓' : '…'}
        </div>
        <h1>{heading.title}</h1>
        <p className="success-message">{heading.message}</p>

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
            <span className="label">预约状态：</span>
            <span className={`value status-chip status-${booking.status}`}>{statusText[booking.status] || booking.status}</span>
          </div>
          <div className="detail-row">
            <span className="label">支付状态：</span>
            <span className={`value status-chip status-${booking.payment_status || 'pending'}`}>
              {paymentStatusText[booking.payment_status] || '待支付'}
            </span>
          </div>
          {booking.expires_at && booking.status === 'pending' && (
            <div className="detail-row">
              <span className="label">保留到：</span>
              <span className="value">{formatDateTime(booking.expires_at)}</span>
            </div>
          )}
        </div>

        <div className="customer-info">
          <h2>联系信息</h2>
          <p><strong>姓名：</strong>{booking.first_name} {booking.last_name}</p>
          <p><strong>邮箱：</strong>{booking.email}</p>
          <p><strong>电话：</strong>{booking.phone}</p>
          {booking.notes && <p><strong>备注：</strong>{booking.notes}</p>}
        </div>

        <div className="next-steps">
          <h2>下一步</h2>
          <ul>
            <li>支付成功后，系统会自动确认预约并发送邮件。</li>
            <li>如果预约仍显示处理中，请稍候几秒后刷新本页。</li>
            <li>如需取消，请直接联系客服；如需改期，请使用邮件中的管理链接。</li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to="/" className="home-button">返回首页</Link>
          {booking.status !== 'confirmed' && (
            <Link to="/booking" className="home-button secondary-button">重新预约</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
