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


const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
});

// "2026-10-27T17:40:12" from the API becomes "27 Oct, 5:40 pm"
export function formatDateTime(isoDateTime) {
  return dateTimeFormat.format(new Date(isoDateTime));
}

// "just now", "25 min ago", "3 h ago", or the date for anything older than a day
export function timeAgo(isoDateTime) {
  const minutes = Math.floor((Date.now() - new Date(isoDateTime).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h ago`;
  return formatDateTime(isoDateTime);
}