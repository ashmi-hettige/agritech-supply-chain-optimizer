/**
 * Coloured pill showing how fresh a listing is, e.g. "Fresh · 12 days".
 * The label comes from the backend FreshnessScorer, so the rule lives in one place.
 * @author Ashmi Hettige
 */
const STYLES = {
  FRESH: { text: 'Fresh', className: 'badge-fresh' },
  SELL_SOON: { text: 'Sell soon', className: 'badge-soon' },
  URGENT: { text: 'Urgent', className: 'badge-urgent' },
};

export default function FreshnessBadge({ label, daysLeft, className = '' }) {
  const style = STYLES[label] ?? STYLES.URGENT;
  let days = `${daysLeft} days`;
  if (daysLeft === 1) days = '1 day';
  if (daysLeft === 0) days = 'last day';

  return (
    <span className={`badge ${style.className} ${className}`}>
      {style.text} · {days}
    </span>
  );
}