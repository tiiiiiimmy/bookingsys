const normalizeDateInput = (value) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

export const usePublicLanguage = (copy) => {
  const locale = 'en-US';
  const t = copy?.en ?? copy ?? {};

  const formatMoney = (value, options = {}) => new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(Number(value || 0));

  const formatDate = (value, options = {}) => {
    const date = normalizeDateInput(value);
    return date ? date.toLocaleDateString(locale, options) : '';
  };

  const formatTime = (value, options = {}) => {
    const date = normalizeDateInput(value);
    return date ? date.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }) : '';
  };

  const formatDateTime = (value, options = {}) => {
    const date = normalizeDateInput(value);
    return date ? date.toLocaleString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }) : '';
  };

  return {
    language: 'en',
    setLanguage: () => {},
    t,
    locale,
    formatMoney,
    formatDate,
    formatTime,
    formatDateTime,
  };
};

export default usePublicLanguage;
