import React from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import AdminLanguageSwitcher from './AdminLanguageSwitcher';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = () => {
  const { admin, logout, loading } = useAuth();
  const { language, setLanguage, t } = useAdminLanguage();

  if (loading) return <div className="loading-screen"><p>{t.layout.loading}</p></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin-layout">
      <nav className="admin-nav">
        <div className="admin-nav-header">
          <h2>{t.layout.brand}</h2>
          <div aria-label={t.common.languageSwitcher}>
            <AdminLanguageSwitcher language={language} setLanguage={setLanguage} />
          </div>
        </div>
        <ul className="admin-nav-links">
          <li>
            <NavLink to="/admin/dashboard">{t.layout.dashboard}</NavLink>
          </li>
          <li>
            <NavLink to="/admin/bookings">{t.layout.bookings}</NavLink>
          </li>
          <li>
            <NavLink to="/admin/availability">{t.layout.availability}</NavLink>
          </li>
          <li>
            <NavLink to="/admin/customers">{t.layout.customers}</NavLink>
          </li>
        </ul>
        <div className="admin-nav-footer">
          <p>{admin.firstName} {admin.lastName}</p>
          <button onClick={logout} className="btn-secondary">{t.layout.logout}</button>
        </div>
      </nav>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
};
export default AdminLayout;
