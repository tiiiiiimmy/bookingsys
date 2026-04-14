import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLanguageSwitcher from '../../components/layout/AdminLanguageSwitcher';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const { language, setLanguage, t } = useAdminLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="login-page">
      <div className="login-container">
        <div className="admin-login-header">
          <h1>{t.login.title}</h1>
          <div aria-label={t.common.languageSwitcher}>
            <AdminLanguageSwitcher language={language} setLanguage={setLanguage} />
          </div>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>{t.login.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div className="form-group">
            <label>{t.login.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t.login.submitting : t.login.submit}
          </button>
        </form>
        <div className="login-footer">
          <a href="/">{t.login.backHome}</a>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
