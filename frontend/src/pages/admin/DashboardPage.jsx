import React, { useEffect, useState } from 'react';
import { getAdminStatusLabel } from '../../content/adminContent';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import { useAuth } from '../../hooks/useAuth';
import adminService from '../../services/adminService';
import {
  adminCardListItemClass,
  adminEmptyStateClass,
  adminListClass,
  adminLoadingClass,
  adminPageTitleClass,
  adminPanelClass,
  adminPanelHeaderClass,
  adminShellClass,
  getAdminAlertClass,
  getAdminStatusChipClass,
} from '../../components/admin/adminStyles';

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
    return (
      <div className={adminLoadingClass}>
        <p>{t.common.loading}</p>
      </div>
    );
  }

  const statCards = [
    { label: t.dashboard.stats.todayBookings, value: stats?.todayBookings ?? 0 },
    { label: t.dashboard.stats.weekBookings, value: stats?.weekBookings ?? 0 },
    { label: t.dashboard.stats.monthRevenue, value: formatMoney(stats?.monthRevenue ?? 0) },
    { label: t.dashboard.stats.customerCount, value: stats?.customerCount ?? 0 },
    { label: t.dashboard.stats.pendingRescheduleRequests, value: stats?.pendingRescheduleRequests ?? 0 },
  ];

  return (
    <div className={adminShellClass}>
      <section className={adminPanelClass}>
        <p className="text-xs uppercase tracking-[0.3em] text-tertiary">{t.layout.dashboard}</p>
        <h1 className={`mt-3 ${adminPageTitleClass}`}>
          {t.dashboard.welcome}, {admin?.firstName} {admin?.lastName}
        </h1>
      </section>

      {error ? <div className={getAdminAlertClass('error')}>{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[1.75rem] border border-outline/15 bg-white/85 p-5 shadow-[0_14px_32px_rgba(72,46,35,0.08)]"
          >
            <p className="text-sm text-on-surface-variant">{card.label}</p>
            <p className="mt-4 font-headline text-4xl text-on-surface">{card.value}</p>
          </div>
        ))}
      </section>

      <section className={adminPanelClass}>
        <div className={adminPanelHeaderClass}>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tertiary">{t.layout.bookings}</p>
            <h2 className="mt-2 font-headline text-2xl text-on-surface">{t.dashboard.upcomingTitle}</h2>
          </div>
        </div>

        {!stats?.upcomingBookings?.length ? (
          <p className={adminEmptyStateClass}>{t.dashboard.emptyUpcoming}</p>
        ) : (
          <div className={adminListClass}>
            {stats.upcomingBookings.map((booking) => (
              <div key={booking.id} className={adminCardListItemClass}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-on-surface">{booking.customerName}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{booking.serviceName}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={getAdminStatusChipClass(booking.status)}>
                      {getAdminStatusLabel(t, booking.status)}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm text-on-surface-variant">{formatDateTime(booking.startTime)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
