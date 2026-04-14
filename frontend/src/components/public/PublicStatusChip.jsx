import React from 'react';

const STYLES = {
  neutral: 'bg-surface-container text-on-surface-variant',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-rose-100 text-rose-800',
  info: 'bg-primary-fixed text-on-primary-fixed',
};

const PublicStatusChip = ({ children, tone = 'neutral' }) => {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${STYLES[tone] || STYLES.neutral}`}>
      {children}
    </span>
  );
};

export default PublicStatusChip;
