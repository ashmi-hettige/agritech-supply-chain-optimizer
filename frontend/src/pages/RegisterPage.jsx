/**
 * Sign-up form. Farmers also give their farm name and location.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import FormField from '../components/FormField';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { validateRegister } from '../utils/validation';
import { DISTRICTS } from '../constants/districts';
import './AuthPage.css';

const ROLES = [
  { value: 'FARMER', label: 'Farmer', description: 'Sell my harvest' },
  { value: 'BUYER', label: 'Buyer', description: 'Buy fresh produce' },
  { value: 'TRANSPORTER', label: 'Transporter', description: 'Deliver orders' },
];

const EMPTY_FORM = {
  role: 'FARMER',
  fullName: '',
  email: '',
  phone: '',
  district: '',
  password: '',
  confirmPassword: '',
  farmName: '',
  farmLatitude: '',
  farmLongitude: '',
};

// the server reports the cross-field farm rule as "farmDetailsValid"; show it on the farm name
function mapServerErrors(fieldErrors) {
  const { farmDetailsValid, ...rest } = fieldErrors;
  return farmDetailsValid ? { ...rest, farmName: farmDetailsValid } : rest;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // links like /register?role=BUYER open the form with that role already chosen
  const roleFromLink = searchParams.get('role');
  const startRole = ROLES.some((role) => role.value === roleFromLink) ? roleFromLink : 'FARMER';

  const [form, setForm] = useState({ ...EMPTY_FORM, role: startRole });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const isFarmer = form.role === 'FARMER';

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function fillMyLocation() {
    if (!navigator.geolocation) {
      showToast('Your browser cannot share its location. Please type it in.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          farmLatitude: position.coords.latitude.toFixed(5),
          farmLongitude: position.coords.longitude.toFixed(5),
        }));
        setErrors((current) => ({ ...current, farmLatitude: undefined, farmLongitude: undefined }));
        setLocating(false);
      },
      () => {
        showToast('Location permission was denied. Please type it in.', 'error');
        setLocating(false);
      },
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');

    const found = validateRegister(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }

    const details = {
      role: form.role,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      district: form.district || null,
      password: form.password,
      farmName: isFarmer ? form.farmName.trim() : null,
      farmLatitude: isFarmer ? Number(form.farmLatitude) : null,
      farmLongitude: isFarmer ? Number(form.farmLongitude) : null,
    };

    setSubmitting(true);
    try {
      const user = await register(details);
      showToast(`Welcome to GoviRoute, ${user.fullName.split(' ')[0]}`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrors(mapServerErrors(getFieldErrors(error)));
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

        <div className="auth-form-wrap wide">
          <div className="auth-heading">
            <h1>Create your account</h1>
          </div>

          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

          <form className="form" onSubmit={handleSubmit} noValidate>
            <fieldset className="role-options">
              <legend className="field-label" style={{ marginBottom: 'var(--space-2)' }}>I am a</legend>
              {ROLES.map((role) => (
                <label key={role.value} className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={form.role === role.value}
                    onChange={handleChange}
                  />
                  <strong>{role.label}</strong>
                  <span>{role.description}</span>
                </label>
              ))}
            </fieldset>

            <FormField id="fullName" label="Full name" autoComplete="name"
              value={form.fullName} onChange={handleChange} error={errors.fullName} />

            <div className="form-row">
              <FormField id="email" label="Email" type="email" autoComplete="email"
                value={form.email} onChange={handleChange} error={errors.email} />
              <FormField id="phone" label="Phone (optional)" type="tel" autoComplete="tel"
                placeholder="0771234567" value={form.phone} onChange={handleChange} error={errors.phone} />
            </div>

            <FormField id="district" label="District" as="select"
              value={form.district} onChange={handleChange} error={errors.district}>
              <option value="">Choose your district</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </FormField>

            <div className="form-row">
              <FormField id="password" label="Password" type="password" autoComplete="new-password"
                hint="At least 8 characters, with a letter and a number"
                value={form.password} onChange={handleChange} error={errors.password} />
              <FormField id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password"
                value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
            </div>

            {isFarmer && (
              <div className="farm-box">
                <FormField id="farmName" label="Farm name" placeholder="e.g. Perera Farm"
                  value={form.farmName} onChange={handleChange} error={errors.farmName} />
                <div className="location-row">
                  <span className="field-label">Farm location (pickup point)</span>
                  <button type="button" className="btn btn-outline" onClick={fillMyLocation} disabled={locating}>
                    {locating ? 'Finding you…' : 'Use my current location'}
                  </button>
                </div>
                <div className="form-row">
                  <FormField id="farmLatitude" label="Latitude" inputMode="decimal" placeholder="7.85"
                    value={form.farmLatitude} onChange={handleChange} error={errors.farmLatitude} />
                  <FormField id="farmLongitude" label="Longitude" inputMode="decimal" placeholder="80.65"
                    value={form.farmLongitude} onChange={handleChange} error={errors.farmLongitude} />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>

      <div className="auth-photo-side">
        <img src="/images/market-stall-lk.jpg" alt="" />
        <div className="auth-photo-caption">
          <h2>One platform for the whole chain</h2>
          <p>Farmers, buyers and transporters working together to cut waste between the field and the market.</p>
        </div>
      </div>
    </div>
  );
}