import React, { useEffect, useState } from 'react';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import adminService from '../../services/adminService';

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const CustomersPage = () => {
  const { t, formatDateTime, formatMoney } = useAdminLanguage();
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
      setError(extractError(err, t.customers.loadListError));
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
      setError(extractError(err, t.customers.loadDetailError));
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [t.customers.loadListError]);

  useEffect(() => {
    loadCustomerDetail(selectedCustomerId);
  }, [selectedCustomerId]);

  return (
    <div className="admin-two-column">
      <section className="admin-panel">
        <div className="section-header">
          <h1>{t.customers.title}</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filter-grid">
          <input
            type="text"
            placeholder={t.customers.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" className="btn-primary" onClick={loadCustomers}>
            {t.customers.search}
          </button>
        </div>

        {loading ? (
          <p className="empty-state">{t.common.loading}</p>
        ) : !customers.length ? (
          <p className="empty-state">{t.customers.empty}</p>
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
                  <span>{customer.bookingCount} {t.customers.bookingCountSuffix}</span>
                  <span>{formatMoney(customer.totalSpent)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="section-header">
          <h2>{t.customers.detailTitle}</h2>
        </div>

        {detailLoading ? (
          <p className="empty-state">{t.common.loadingDetails}</p>
        ) : !selectedCustomer ? (
          <p className="empty-state">{t.customers.selectHint}</p>
        ) : (
          <>
            <div className="detail-grid">
              <div><strong>{t.customers.fields.name}</strong><p>{selectedCustomer.firstName} {selectedCustomer.lastName}</p></div>
              <div><strong>{t.customers.fields.email}</strong><p>{selectedCustomer.email}</p></div>
              <div><strong>{t.customers.fields.phone}</strong><p>{selectedCustomer.phone}</p></div>
              <div><strong>{t.customers.fields.createdAt}</strong><p>{formatDateTime(selectedCustomer.createdAt)}</p></div>
              <div><strong>{t.customers.fields.bookingCount}</strong><p>{selectedCustomer.bookingCount}</p></div>
              <div><strong>{t.customers.fields.totalSpent}</strong><p>{formatMoney(selectedCustomer.totalSpent)}</p></div>
            </div>

            <div className="admin-form-section">
              <h3>{t.customers.historyTitle}</h3>
              {!selectedCustomer.bookings?.length ? (
                <p className="empty-state">{t.customers.emptyHistory}</p>
              ) : (
                <div className="admin-list">
                  {selectedCustomer.bookings.map((booking) => (
                    <div key={booking.id} className="admin-list-item">
                      <div>
                        <strong>#{booking.id} {booking.serviceName}</strong>
                        <p>{formatDateTime(booking.startTime)}</p>
                      </div>
                      <div className="admin-list-meta">
                        <span className={`status-chip status-${booking.status}`}>{t.statuses[booking.status] || booking.status}</span>
                        <span>{formatMoney(booking.price)}</span>
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
