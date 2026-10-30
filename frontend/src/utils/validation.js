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

  if (!form.phone.trim()) errors.phone = 'Phone is required';
  else if (!PHONE_PATTERN.test(form.phone.trim())) errors.phone = 'Phone must be 10 digits starting with 0';

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

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

// same limits as ListingRequest.java on the backend
export function validateListing(form, today) {
  const errors = {};

  if (!form.cropId) errors.cropId = 'Choose a crop';

  if (form.quantityKg === '') errors.quantityKg = 'Quantity is required';
  else if (!MONEY_PATTERN.test(form.quantityKg)) errors.quantityKg = 'Enter a positive number, e.g. 500 or 12.5';
  else if (!inRange(form.quantityKg, 1, 100000)) errors.quantityKg = 'Quantity must be between 1 and 100,000 kg';

  if (form.pricePerKg === '') errors.pricePerKg = 'Price is required';
  else if (!MONEY_PATTERN.test(form.pricePerKg)) errors.pricePerKg = 'Enter a positive amount, e.g. 210 or 99.50';
  else if (!inRange(form.pricePerKg, 1, 10000)) errors.pricePerKg = 'Price must be between Rs 1 and Rs 10,000 per kg';

  if (!form.harvestDate) errors.harvestDate = 'Harvest date is required';
  else if (form.harvestDate > today) errors.harvestDate = 'Harvest date cannot be in the future';

  if (!['A', 'B', 'C'].includes(form.grade)) errors.grade = 'Grade must be A, B or C';
  if (!form.district) errors.district = 'District is required';

  if (!inRange(form.pickupLat, 5.9, 9.9)) errors.pickupLat = 'Latitude must be between 5.9 and 9.9';
  if (!inRange(form.pickupLng, 79.5, 81.9)) errors.pickupLng = 'Longitude must be between 79.5 and 81.9';

  return errors;
}


// one cart line: same limits as CartItemRequest.java
export function validateOrderQuantity(value, availableKg) {
  const text = String(value).trim();
  if (text === '') return 'Enter how many kg you want';
  if (!MONEY_PATTERN.test(text)) return 'Enter a number of kg, e.g. 25 or 12.5';
  if (Number(text) < 1) return 'Order at least 1 kg';
  if (Number(text) > Number(availableKg)) return `Only ${Number(availableKg)} kg left`;
  return '';
}

export function validateCheckout(form) {
  const errors = {};
  if (!form.deliveryAddress.trim()) errors.deliveryAddress = 'Delivery address is required';
  else if (form.deliveryAddress.trim().length > 200) errors.deliveryAddress = 'Address must be at most 200 characters';
  if (!form.district) errors.district = 'Choose the delivery district';
  return errors;
}