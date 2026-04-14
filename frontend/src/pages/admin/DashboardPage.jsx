import React, { useEffect, useState } from 'react';
import { getAdminStatusLabel } from '../../content/adminContent';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import { useAuth } from '../../hooks/useAuth';
import adminService from '../../services/adminService';

const DashboardPage = () => {
  const { admin } = useAuth();
  const { t, formatMoney, formatDateTime } = useAdminLanguage();
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
        setError(err.response?.data?.error?.message || t.dashboard.loadError);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [t.dashboard.loadError]);

  if (loading) {
    return <div className="loading-screen"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="dashboard-page">
      <h1>{t.dashboard.welcome}, {admin?.firstName} {admin?.lastName}</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>{t.dashboard.stats.todayBookings}</h3>
          <p className="stat-number">{stats?.todayBookings ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>{t.dashboard.stats.weekBookings}</h3>
          <p className="stat-number">{stats?.weekBookings ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <h3>{t.dashboard.stats.monthRevenue}</h3>
          <p className="stat-number">{formatMoney(stats?.monthRevenue ?? 0)}</p>
        </div>
        <div className="dashboard-card">
          <h3>{t.dashboard.stats.customerCount}</h3>
          <p className="stat-number">{stats?.customerCount ?? 0}</p>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-secondary">
        <div className="dashboard-card">
          <h3>{t.dashboard.stats.pendingRescheduleRequests}</h3>
          <p className="stat-number">{stats?.pendingRescheduleRequests ?? 0}</p>
        </div>
      </div>

      <section className="admin-panel">
        <div className="section-header">
          <h2>{t.dashboard.upcomingTitle}</h2>
        </div>
        {!stats?.upcomingBookings?.length ? (
          <p className="empty-state">{t.dashboard.emptyUpcoming}</p>
        ) : (
          <div className="admin-list">
            {stats.upcomingBookings.map((booking) => (
              <div key={booking.id} className="admin-list-item">
                <div>
                  <strong>{booking.customerName}</strong>
                  <p>{booking.serviceName}</p>
                </div>
                <div className="admin-list-meta">
                  <span>{formatDateTime(booking.startTime)}</span>
                  <span className={`status-chip status-${booking.status}`}>{getAdminStatusLabel(t, booking.status)}</span>
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
