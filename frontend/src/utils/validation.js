/**
 * Client-side form checks. They match the backend rules, so users see errors before submitting.
 * The server still validates everything, because browser checks can be bypassed.
 * @author Ashmi Hettige
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const PHONE_PATTERN = /^0\d{9}$/;

function inRange(value, min, max) {
  const number = Number(value);
  return value !== '' && !Number.isNaN(number) && number >= min && number <= max;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateRegister(form) {
  const errors = {};

  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  else if (form.fullName.trim().length > 100) errors.fullName = 'Full name must be at most 100 characters';

  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address';

  if (form.phone && !PHONE_PATTERN.test(form.phone)) {
    errors.phone = 'Phone must be 10 digits starting with 0';
  }

  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8 || form.password.length > 64) errors.password = 'Password must be 8 to 64 characters';
  else if (!PASSWORD_PATTERN.test(form.password)) errors.password = 'Password must contain at least one letter and one number';

  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';

  if (form.role === 'FARMER') {
    if (!form.farmName.trim()) errors.farmName = 'Farm name is required for farmers';
    if (!inRange(form.farmLatitude, 5.9, 9.9)) errors.farmLatitude = 'Latitude must be between 5.9 and 9.9';
    if (!inRange(form.farmLongitude, 79.5, 81.9)) errors.farmLongitude = 'Longitude must be between 79.5 and 81.9';
  }

  return errors;
}