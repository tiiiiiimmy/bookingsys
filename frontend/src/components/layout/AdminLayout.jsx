import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = () => {
  const { admin, logout, loading } = useAuth();
  if (loading) return <div className="loading-screen"><p>加载中...</p></div>;
  if (!admin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin-layout">
      <nav className="admin-nav">
        <div className="admin-nav-header"><h2>按摩预约系统</h2></div>
        <ul className="admin-nav-links">
          <li><Link to="/admin/dashboard">控制台</Link></li>
          <li><Link to="/admin/bookings">预约管理</Link></li>
          <li><Link to="/admin/availability">时间管理</Link></li>
          <li><Link to="/admin/customers">客户管理</Link></li>
        </ul>
        <div className="admin-nav-footer">
          <p>{admin.firstName} {admin.lastName}</p>
          <button onClick={logout} className="btn-secondary">退出登录</button>
        </div>
      </nav>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
};
export default AdminLayout;
