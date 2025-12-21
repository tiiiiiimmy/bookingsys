import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const DashboardPage = () => {
  const { admin } = useAuth();
  return (
    <div className="dashboard-page">
      <h1>欢迎, {admin?.firstName} {admin?.lastName}</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card"><h3>今日预约</h3><p className="stat-number">0</p></div>
        <div className="dashboard-card"><h3>本周预约</h3><p className="stat-number">0</p></div>
        <div className="dashboard-card"><h3>本月收入</h3><p className="stat-number">$0</p></div>
        <div className="dashboard-card"><h3>客户总数</h3><p className="stat-number">0</p></div>
      </div>
      <div className="upcoming-section">
        <h2>即将到来的预约</h2>
        <p className="empty-state">暂无预约</p>
      </div>
    </div>
  );
};
export default DashboardPage;
