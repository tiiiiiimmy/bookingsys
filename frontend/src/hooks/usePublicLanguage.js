import { useEffect, useState } from 'react';
import {
  LANGUAGES,
  PUBLIC_LANGUAGE_STORAGE_KEY,
} from '../content/publicSiteContent';

const LOCALE_BY_LANGUAGE = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  en: 'en-US',
};

const getStoredLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = window.localStorage.getItem(PUBLIC_LANGUAGE_STORAGE_KEY);
  return LANGUAGES.some((item) => item.code === stored) ? stored : 'en';
};

const normalizeDateInput = (value) => {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
};

export const usePublicLanguage = (copy) => {
  const [language, setLanguage] = useState(getStoredLanguage);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PUBLIC_LANGUAGE_STORAGE_KEY, language);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const locale = LOCALE_BY_LANGUAGE[language] || 'en-US';
  const t = copy?.[language] ?? copy?.en ?? {};

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
      month: language === 'en' ? 'long' : 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    }) : '';
  };

  return {
    language,
    setLanguage,
    t,
    locale,
    formatMoney,
    formatDate,
    formatTime,
    formatDateTime,
  };
};

export default usePublicLanguage;
