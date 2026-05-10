import React, { useEffect, useState } from 'react';
import {
  adminButtonSuccessClass,
  adminInputClass,
  adminPageTitleClass,
  adminPanelClass,
  adminPanelHeaderClass,
} from '../../components/admin/adminStyles';
import productOrderService from '../../services/productOrderService';

const STATUSES = ['', 'pending', 'fulfilled'];

const StatusChip = ({ status }) => (
  <span
    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
    style={
      status === 'fulfilled'
        ? { background: 'rgba(5,150,105,0.12)', color: '#065f46' }
        : { background: 'rgba(201,168,76,0.15)', color: '#92600a' }
    }
  >
    {status === 'fulfilled' ? '✓ Fulfilled' : '⏳ Pending'}
  </span>
);

const ProductOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fulfilling, setFulfilling] = useState(null);

  const load = async (status) => {
    setLoading(true);
    setError('');
    try {
      const res = await productOrderService.getAll(status || undefined);
      setOrders(res.data ?? []);
    } catch {
      setError('Failed to load product orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const handleFulfill = async (id) => {
    setFulfilling(id);
    setMessage('');
    setError('');
    try {
      await productOrderService.fulfill(id);
      setMessage('Order marked as fulfilled.');
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'fulfilled' } : o));
    } catch {
      setError('Failed to update order.');
    } finally {
      setFulfilling(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className={adminPanelHeaderClass}>
        <h1 className={adminPageTitleClass}>Product Orders</h1>
      </div>

      {message && (
        <div className="rounded-2xl px-5 py-3 text-sm" style={{ background: 'rgba(5,150,105,0.10)', color: '#065f46' }}>
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-2xl px-5 py-3 text-sm" style={{ background: 'rgba(186,26,26,0.08)', color: '#ba1a1a' }}>
          {error}
        </div>
      )}

      <div className={adminPanelClass}>
        {/* Filter */}
        <div className="mb-5 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
              style={
                statusFilter === s
                  ? { background: '#8f4d2f', color: '#fff' }
                  : { border: '1px solid rgba(143,77,47,0.3)', color: '#8f4d2f' }
              }
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-on-surface-variant">No orders found.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-outline/15 bg-white/70 p-5"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-on-surface">{order.productName}</span>
                    <StatusChip status={order.status} />
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    <span className="font-medium text-on-surface">{order.customerName}</span>
                    {' · '}{order.customerEmail}
                    {order.customerPhone && <> · {order.customerPhone}</>}
                  </p>
                  {order.intention && (
                    <p className="max-w-xl text-sm italic text-on-surface-variant">
                      "{order.intention}"
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                {order.status === 'pending' && (
                  <button
                    type="button"
                    disabled={fulfilling === order.id}
                    onClick={() => handleFulfill(order.id)}
                    className={adminButtonSuccessClass}
                  >
                    {fulfilling === order.id ? 'Updating…' : 'Mark Fulfilled'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOrdersPage;
