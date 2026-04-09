import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await adminService.getCustomers(search ? { search } : {});
      setCustomers(response.data || []);
      if (response.data?.length) {
        const stillExists = response.data.some((customer) => customer.id === selectedCustomerId);
        if (!stillExists) {
          setSelectedCustomerId(response.data[0].id);
        }
      } else {
        setSelectedCustomerId(null);
      }
    } catch (err) {
      setError(extractError(err, '无法加载客户列表'));
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetail = async (customerId) => {
    if (!customerId) {
      setSelectedCustomer(null);
      return;
    }

    try {
      setDetailLoading(true);
      const response = await adminService.getCustomerById(customerId);
      setSelectedCustomer(response.data);
    } catch (err) {
      setError(extractError(err, '无法加载客户详情'));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadCustomerDetail(selectedCustomerId);
  }, [selectedCustomerId]);

  return (
    <div className="admin-two-column">
      <section className="admin-panel">
        <div className="section-header">
          <h1>客户管理</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filter-grid">
          <input
            type="text"
            placeholder="搜索姓名 / 邮箱 / 电话"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" className="btn-primary" onClick={loadCustomers}>
            搜索
          </button>
        </div>

        {loading ? (
          <p className="empty-state">加载中...</p>
        ) : !customers.length ? (
          <p className="empty-state">暂无客户记录</p>
        ) : (
          <div className="admin-list">
            {customers.map((customer) => (
              <button
                type="button"
                key={customer.id}
                className={`admin-list-item admin-list-button ${selectedCustomerId === customer.id ? 'selected' : ''}`}
                onClick={() => setSelectedCustomerId(customer.id)}
              >
                <div>
                  <strong>{customer.firstName} {customer.lastName}</strong>
                  <p>{customer.email}</p>
                  <p>{customer.phone}</p>
                </div>
                <div className="admin-list-meta">
                  <span>{customer.bookingCount} 次预约</span>
                  <span>${customer.totalSpent}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="section-header">
          <h2>客户详情</h2>
        </div>

        {detailLoading ? (
          <p className="empty-state">加载详情中...</p>
        ) : !selectedCustomer ? (
          <p className="empty-state">请选择左侧客户查看详情</p>
        ) : (
          <>
            <div className="detail-grid">
              <div><strong>姓名</strong><p>{selectedCustomer.firstName} {selectedCustomer.lastName}</p></div>
              <div><strong>邮箱</strong><p>{selectedCustomer.email}</p></div>
              <div><strong>电话</strong><p>{selectedCustomer.phone}</p></div>
              <div><strong>客户创建时间</strong><p>{new Date(selectedCustomer.createdAt).toLocaleString('zh-CN')}</p></div>
              <div><strong>预约次数</strong><p>{selectedCustomer.bookingCount}</p></div>
              <div><strong>累计消费</strong><p>${selectedCustomer.totalSpent}</p></div>
            </div>

            <div className="admin-form-section">
              <h3>预约历史</h3>
              {!selectedCustomer.bookings?.length ? (
                <p className="empty-state">暂无预约历史</p>
              ) : (
                <div className="admin-list">
                  {selectedCustomer.bookings.map((booking) => (
                    <div key={booking.id} className="admin-list-item">
                      <div>
                        <strong>#{booking.id} {booking.serviceName}</strong>
                        <p>{new Date(booking.startTime).toLocaleString('zh-CN')}</p>
                      </div>
                      <div className="admin-list-meta">
                        <span className={`status-chip status-${booking.status}`}>{booking.status}</span>
                        <span>${booking.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CustomersPage;
