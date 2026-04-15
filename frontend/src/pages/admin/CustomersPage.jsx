import React, { useEffect, useState } from 'react';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import adminService from '../../services/adminService';
import {
  adminButtonPrimaryClass,
  adminDetailCardClass,
  adminDetailGridClass,
  adminEmptyStateClass,
  adminFieldLabelClass,
  adminFieldValueClass,
  adminGridClass,
  adminInputClass,
  adminListButtonClass,
  adminListClass,
  adminPageTitleClass,
  adminPanelClass,
  adminPanelHeaderClass,
  adminSectionStackClass,
  adminSubsectionTitleClass,
  getAdminAlertClass,
  getAdminStatusChipClass,
} from '../../components/admin/adminStyles';

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
      setError('');
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
      setError('');
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
    <div className={adminGridClass}>
      <section className={adminPanelClass}>
        <div className={adminPanelHeaderClass}>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-tertiary">{t.layout.customers}</p>
            <h1 className={`mt-3 ${adminPageTitleClass}`}>{t.customers.title}</h1>
          </div>
        </div>

        {error ? <div className={`${getAdminAlertClass('error')} mb-5`}>{error}</div> : null}

        <div className="mb-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            className={adminInputClass}
            placeholder={t.customers.searchPlaceholder}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className={adminButtonPrimaryClass} onClick={loadCustomers} type="button">
            {t.customers.search}
          </button>
        </div>

        {loading ? (
          <p className={adminEmptyStateClass}>{t.common.loading}</p>
        ) : !customers.length ? (
          <p className={adminEmptyStateClass}>{t.customers.empty}</p>
        ) : (
          <div className={adminListClass}>
            {customers.map((customer) => {
              const isSelected = selectedCustomerId === customer.id;

              return (
                <button
                  key={customer.id}
                  className={`${adminListButtonClass} ${
                    isSelected ? 'border-primary bg-primary-fixed/20 ring-2 ring-primary-fixed' : ''
                  }`}
                  type="button"
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-on-surface">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="mt-1 text-sm text-on-surface-variant">{customer.email}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{customer.phone}</p>
                    </div>
                    <div className="text-right text-sm text-on-surface-variant">
                      <p>{customer.bookingCount} {t.customers.bookingCountSuffix}</p>
                      <p className="mt-1 font-semibold text-on-surface">{formatMoney(customer.totalSpent)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className={`${adminPanelClass} ${adminSectionStackClass}`}>
        <div className={adminPanelHeaderClass}>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-tertiary">{t.layout.customers}</p>
            <h2 className="mt-2 font-headline text-2xl text-on-surface">{t.customers.detailTitle}</h2>
          </div>
        </div>

        {detailLoading ? (
          <p className={adminEmptyStateClass}>{t.common.loadingDetails}</p>
        ) : !selectedCustomer ? (
          <p className={adminEmptyStateClass}>{t.customers.selectHint}</p>
        ) : (
          <>
            <div className={adminDetailGridClass}>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.customers.fields.name}</p>
                <p className={adminFieldValueClass}>
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.customers.fields.email}</p>
                <p className={adminFieldValueClass}>{selectedCustomer.email}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.customers.fields.phone}</p>
                <p className={adminFieldValueClass}>{selectedCustomer.phone}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.customers.fields.createdAt}</p>
                <p className={adminFieldValueClass}>{formatDateTime(selectedCustomer.createdAt)}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.customers.fields.bookingCount}</p>
                <p className={adminFieldValueClass}>{selectedCustomer.bookingCount}</p>
              </div>
              <div className={adminDetailCardClass}>
                <p className={adminFieldLabelClass}>{t.customers.fields.totalSpent}</p>
                <p className={adminFieldValueClass}>{formatMoney(selectedCustomer.totalSpent)}</p>
              </div>
            </div>

            <div>
              <h3 className={adminSubsectionTitleClass}>{t.customers.historyTitle}</h3>
              {!selectedCustomer.bookings?.length ? (
                <p className={adminEmptyStateClass}>{t.customers.emptyHistory}</p>
              ) : (
                <div className={adminListClass}>
                  {selectedCustomer.bookings.map((booking) => (
                    <div key={booking.id} className={adminListButtonClass}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-on-surface">
                            #{booking.id} {booking.serviceName}
                          </p>
                          <p className="mt-1 text-sm text-on-surface-variant">{formatDateTime(booking.startTime)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={getAdminStatusChipClass(booking.status)}>
                            {t.statuses[booking.status] || booking.status}
                          </span>
                          <span className="text-sm font-semibold text-on-surface">{formatMoney(booking.price)}</span>
                        </div>
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
