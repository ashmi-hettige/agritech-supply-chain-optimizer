/**
 * Formatting helpers for money, weights and dates, so every page shows them the same way.
 * @author Ashmi Hettige
 */
const numberFormat = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatPrice(value) {
  return `LKR ${numberFormat.format(Number(value))}`;
}

export function formatKg(value) {
  return `${numberFormat.format(Number(value))} kg`;
}

// "2026-10-22" from the API becomes "22 Oct 2026"
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormat.format(new Date(year, month - 1, day));
}

export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}