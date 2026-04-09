import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import adminService from '../../services/adminService';

const DashboardPage = () => {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await adminService.getDashboardStats();
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || '无法加载控制台数据');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div className="loading-screen"><p>加载中...</p></div>;
  }

  return (
    <div className="dashboard-page">
      <h1>欢迎, {admin?.firstName} {admin?.lastName}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>今日预约</h3>
          <p className="stat-number">{stats?.todayBookings ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>本周预约</h3>
          <p className="stat-number">{stats?.weekBookings ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>本月收入</h3>
          <p className="stat-number">${stats?.monthRevenue ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>客户总数</h3>
          <p className="stat-number">{stats?.customerCount ?? 0}</p>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-secondary">
        <div className="dashboard-card">
          <h3>待处理改期</h3>
          <p className="stat-number">{stats?.pendingRescheduleRequests ?? 0}</p>
        </div>
      </div>

      <section className="admin-panel">
        <div className="section-header">
          <h2>即将到来的预约</h2>
        </div>
        {!stats?.upcomingBookings?.length ? (
          <p className="empty-state">暂无即将到来的预约</p>
        ) : (
          <div className="admin-list">
            {stats.upcomingBookings.map((booking) => (
              <div key={booking.id} className="admin-list-item">
                <div>
                  <strong>{booking.customerName}</strong>
                  <p>{booking.serviceName}</p>
                </div>
                <div className="admin-list-meta">
                  <span>{new Date(booking.startTime).toLocaleString('zh-CN')}</span>
                  <span className={`status-chip status-${booking.status}`}>{booking.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
