import React from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import { useAuth } from '../../hooks/useAuth';
import AdminLanguageSwitcher from './AdminLanguageSwitcher';
import {
  adminButtonSecondaryClass,
  adminLoadingClass,
  getAdminStatusChipClass,
} from '../admin/adminStyles';

const getNavLinkClass = ({ isActive }) =>
  `block rounded-[1.25rem] px-4 py-3 text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-primary text-on-primary shadow-[0_12px_24px_rgba(143,77,47,0.2)]'
      : 'text-on-surface-variant hover:bg-primary-fixed/40 hover:text-primary'
  }`;

const AdminLayout = () => {
  const { admin, logout, loading } = useAuth();
  const { language, setLanguage, t } = useAdminLanguage();

  if (loading) {
    return (
      <div className={adminLoadingClass}>
        <p>{t.layout.loading}</p>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 xl:flex-row xl:items-start">
        <aside className="w-full shrink-0 rounded-[2rem] border border-outline/20 bg-white/80 p-6 shadow-[0_20px_50px_rgba(72,46,35,0.08)] backdrop-blur xl:sticky xl:top-6 xl:w-[300px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-tertiary">{t.layout.brand}</p>
              <h1 className="mt-3 font-headline text-3xl text-on-surface">{admin.firstName} {admin.lastName}</h1>
              <p className="mt-2 text-sm text-on-surface-variant">{t.layout.dashboard}</p>
            </div>
            <span className={getAdminStatusChipClass('active')}>{t.layout.brand}</span>
          </div>

          <div className="mt-5">
            <div aria-label={t.common.languageSwitcher}>
              <AdminLanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
          </div>

          <nav className="mt-8">
            <ul className="space-y-2">
              <li>
                <NavLink className={getNavLinkClass} to="/admin/dashboard">
                  {t.layout.dashboard}
                </NavLink>
              </li>
              <li>
                <NavLink className={getNavLinkClass} to="/admin/bookings">
                  {t.layout.bookings}
                </NavLink>
              </li>
              <li>
                <NavLink className={getNavLinkClass} to="/admin/availability">
                  {t.layout.availability}
                </NavLink>
              </li>
              <li>
                <NavLink className={getNavLinkClass} to="/admin/customers">
                  {t.layout.customers}
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="mt-8 rounded-[1.5rem] bg-surface-container-low px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{t.layout.brand}</p>
            <p className="mt-2 text-sm font-semibold text-on-surface">{admin.email}</p>
            <button className={`${adminButtonSecondaryClass} mt-4 w-full`} onClick={logout} type="button">
              {t.layout.logout}
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
