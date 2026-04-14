import React from 'react';
import { LANGUAGES } from '../../content/publicSiteContent';

const PublicLanguageSwitcher = ({ language, setLanguage }) => {
  const languageButtonClass = (code) => [
    'rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.2em] transition-all duration-200',
    language === code
      ? 'border-outline bg-secondary text-on-secondary'
      : 'border-outline/80 bg-stone-50/80 text-stone-600 hover:border-outline hover:text-orange-700',
  ].join(' ');

  return (
    <div className="flex items-center gap-2">
      {LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          className={languageButtonClass(item.code)}
          onClick={() => setLanguage(item.code)}
          aria-pressed={language === item.code}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default PublicLanguageSwitcher;
