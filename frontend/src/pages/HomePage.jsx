import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      <header className="hero">
        <h1>欢迎预约按摩服务</h1>
        <p>专业的按摩理疗服务，让您放松身心</p>
      </header>
      <div className="container">
        <div className="booking-info">
          <h2>服务时间</h2>
          <p>每周四和周日 9:00 AM - 5:00 PM</p>
          <h2>服务项目</h2>
          <ul className="service-list">
            <li><strong>30分钟</strong> - $50<p>快速缓解疲劳</p></li>
            <li><strong>60分钟</strong> - $90<p>标准全身按摩</p></li>
            <li><strong>90分钟</strong> - $130<p>延长深度理疗</p></li>
          </ul>
          <div className="cta">
            <button className="btn-primary" onClick={() => navigate('/booking')}>立即预约</button>
            <p className="note">预约需在线支付确认</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
