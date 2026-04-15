import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLanguageSwitcher from '../../components/layout/AdminLanguageSwitcher';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import { useAuth } from '../../hooks/useAuth';
import {
  adminButtonPrimaryClass,
  adminInputClass,
  getAdminAlertClass,
} from '../../components/admin/adminStyles';

const LoginPage = () => {
  const { language, setLanguage, t } = useAdminLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error?.message || t.login.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 md:px-6">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-outline/15 bg-[linear-gradient(150deg,rgba(143,77,47,0.94),rgba(63,42,31,0.95))] p-8 text-white shadow-[0_24px_60px_rgba(63,42,31,0.28)] md:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-100/80">{t.layout.brand}</p>
          <h1 className="mt-5 max-w-md font-headline text-5xl leading-tight md:text-6xl">{t.login.title}</h1>
          <div className="mt-10">
            <div aria-label={t.common.languageSwitcher}>
              <AdminLanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-outline/15 bg-white/88 p-8 shadow-[0_24px_60px_rgba(72,46,35,0.08)] backdrop-blur md:p-10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-tertiary">{t.layout.dashboard}</p>
            <h2 className="mt-3 font-headline text-3xl text-on-surface">{t.login.title}</h2>
          </div>

          {error ? <div className={`${getAdminAlertClass('error')} mb-6`}>{error}</div> : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm text-on-surface-variant">
              <span className="mb-2 block font-semibold text-on-surface">{t.login.email}</span>
              <input
                className={adminInputClass}
                disabled={loading}
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block text-sm text-on-surface-variant">
              <span className="mb-2 block font-semibold text-on-surface">{t.login.password}</span>
              <input
                className={adminInputClass}
                disabled={loading}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button className={`${adminButtonPrimaryClass} w-full`} disabled={loading} type="submit">
              {loading ? t.login.submitting : t.login.submit}
            </button>
          </form>

          <div className="mt-8 text-sm text-on-surface-variant">
            <a className="font-semibold text-primary transition-colors hover:text-primary-container" href="/">
              {t.login.backHome}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
