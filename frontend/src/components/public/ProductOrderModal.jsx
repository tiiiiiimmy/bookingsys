import React, { useEffect, useState } from 'react';
import productOrderService from '../../services/productOrderService';

const PRODUCT_META = {
  'White Magic': { subtitle: 'Positive energy work for protection, healing, and spiritual balance.' },
  'Love Spell':  { subtitle: 'Open your heart to love, connection, and emotional harmony.' },
  'Money Spell': { subtitle: 'Align your energy with abundance, opportunity, and prosperity.' },
};

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label style={{ fontSize: '0.75rem', color: '#8a6b3e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.9rem',
  borderRadius: '0.6rem',
  border: '1px solid rgba(201,168,76,0.38)',
  background: 'rgba(253,248,240,0.8)',
  fontSize: '0.875rem',
  color: '#3d2b1f',
  outline: 'none',
};

const ProductOrderModal = ({ productName, onClose }) => {
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', intention: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await productOrderService.create({ productName, ...form });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = PRODUCT_META[productName] ?? {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(30,18,10,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-3xl p-8"
        style={{
          background: 'linear-gradient(160deg, #fdf8f0 0%, #faf3e8 100%)',
          border: '1px solid rgba(201,168,76,0.35)',
          boxShadow: '0 24px 64px rgba(100,60,20,0.22)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
          style={{ background: 'rgba(201,168,76,0.12)', color: '#b8965a' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.12)')}
        >
          ✕
        </button>

        {/* Ornament */}
        <div className="mb-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.6))' }} />
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 0L7.5 5.1L13 4L9.5 6.5L12 10L6.7 8.4L6.5 13L6.3 8.4L1 10L3.5 6.5L0 4L5.5 5.1Z" fill="#c9a84c" />
          </svg>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.6))' }} />
        </div>

        {!done ? (
          <>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: '2rem', color: '#5c3d1e', lineHeight: 1.1, marginBottom: '0.35rem' }}>
              {productName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#8a6b3e', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {meta.subtitle}
            </p>

            {error && (
              <div className="mb-4 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(186,26,26,0.08)', color: '#ba1a1a' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="Your Name *">
                <input
                  required
                  value={form.customerName}
                  onChange={set('customerName')}
                  placeholder="Full name"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.75)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.38)')}
                />
              </Field>

              <Field label="Email *">
                <input
                  required
                  type="email"
                  value={form.customerEmail}
                  onChange={set('customerEmail')}
                  placeholder="your@email.com"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.75)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.38)')}
                />
              </Field>

              <Field label="Phone (optional)">
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={set('customerPhone')}
                  placeholder="+1 (555) 000-0000"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.75)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.38)')}
                />
              </Field>

              <Field label="Your intention (optional)">
                <textarea
                  rows={3}
                  value={form.intention}
                  onChange={set('intention')}
                  placeholder="Share what you are hoping to invite or heal…"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.75)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(201,168,76,0.38)')}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium text-white transition-all duration-200 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #d4b06a 0%, #b8965a 55%, #a07840 100%)' }}
              >
                {submitting ? 'Submitting…' : (
                  <><span style={{ fontSize: '9px' }}>✦</span> Submit My Order</>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(201,168,76,0.15)' }}>
              <span style={{ color: '#c9a84c', fontSize: '1.5rem' }}>✦</span>
            </div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: '1.75rem', color: '#5c3d1e', marginBottom: '0.75rem' }}>
              Order Received
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#8a6b3e', lineHeight: 1.7, maxWidth: '300px' }}>
              Thank you, {form.customerName}. Your {productName} order has been received. We will be in touch at {form.customerEmail} shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full px-7 py-2.5 text-sm transition-all"
              style={{ border: '1px solid rgba(201,168,76,0.5)', color: '#b8965a' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductOrderModal;
