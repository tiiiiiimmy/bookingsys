import React from 'react';
import { LANGUAGES } from '../../content/publicSiteContent';

const AdminLanguageSwitcher = ({ language, setLanguage }) => {
  return (
    <div className="inline-flex flex-wrap items-center gap-2" aria-label="Language switcher">
      {LANGUAGES.map((item) => {
        const isActive = language === item.code;

        return (
          <button
            key={item.code}
            type="button"
            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
              isActive
                ? 'bg-primary text-on-primary'
                : 'border border-outline/40 bg-white/70 text-on-surface-variant hover:border-primary/40 hover:text-primary'
            }`}
            onClick={() => setLanguage(item.code)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default AdminLanguageSwitcher;
