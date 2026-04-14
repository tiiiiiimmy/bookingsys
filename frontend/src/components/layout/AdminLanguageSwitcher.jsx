import React from 'react';
import { LANGUAGES } from '../../content/publicSiteContent';

const AdminLanguageSwitcher = ({ language, setLanguage }) => {
  return (
    <div className="admin-language-switcher" aria-label="Language switcher">
      {LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          className={`admin-language-button ${language === item.code ? 'active' : ''}`}
          onClick={() => setLanguage(item.code)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default AdminLanguageSwitcher;
