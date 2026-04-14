import React from 'react';
import { Link } from 'react-router-dom';
import PublicLanguageSwitcher from './PublicLanguageSwitcher';
import PublicSiteFooter from './PublicSiteFooter';

const PublicPageShell = ({
  language,
  setLanguage,
  brand,
  footer,
  navCopy,
  children,
}) => {
  return (
    <div className="min-h-screen bg-background font-body text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-primary-fixed/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary-fixed/30 blur-3xl" />
      </div>

      <nav className="fixed top-0 z-50 w-full border-b border-outline/30 bg-stone-50/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-8">
          <Link className="font-headline text-xl font-bold text-orange-900" to="/">
            {brand}
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Link
              className="rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-stone-600 transition-colors hover:text-orange-700"
              to="/"
            >
              {navCopy.home}
            </Link>
            <Link
              className="rounded-full px-4 py-2 text-sm font-semibold tracking-wide text-stone-600 transition-colors hover:text-orange-700"
              to="/booking"
            >
              {navCopy.booking}
            </Link>
            <PublicLanguageSwitcher language={language} setLanguage={setLanguage} />
            <Link
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold tracking-wide text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container"
              to="/booking"
            >
              {navCopy.bookNow}
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-28">
        {children}
      </main>

      <PublicSiteFooter brand={brand} footer={footer} />
    </div>
  );
};

export default PublicPageShell;
