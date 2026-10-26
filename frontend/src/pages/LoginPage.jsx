/**
 * Login form with client-side checks and server error messages.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import FormField from '../components/FormField';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getErrorMessage } from '../api/client';
import { validateLogin } from '../utils/validation';
import './AuthPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');

    const found = validateLogin(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      showToast(`Welcome back, ${user.fullName.split(' ')[0]}`);
      navigate(location.state?.from ?? '/dashboard', { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form-side">
        <Link to="/" aria-label="GoviRoute home">
          <Logo size={36} onDark={false} />
        </Link>

        <div className="auth-form-wrap">
          <div className="auth-heading">
            <h1>Log in</h1>
          </div>

          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

          <form className="form" onSubmit={handleSubmit} noValidate>
            <FormField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <FormField
              id="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
            />
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            New to GoviRoute? <Link to="/register">Create a free account</Link>
          </p>
        </div>
      </div>

      <div className="auth-photo-side">
        <img src="/images/farmer-lk.jpg" alt="" />
        <div className="auth-photo-caption">
          <h2>Fresh harvests, smarter routes</h2>
          <p>Sell at the best price and get your harvest to buyers while it is still fresh.</p>
        </div>
      </div>
    </div>
  );
}