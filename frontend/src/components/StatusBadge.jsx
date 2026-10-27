/**
 * A listing's status (Available, Paused, Sold out, Expired, Archived) as text with a coloured dot.
 * @author Ashmi Hettige
 */
const LABELS = {
  AVAILABLE: 'Available',
  PAUSED: 'Paused',
  SOLD_OUT: 'Sold out',
  EXPIRED: 'Expired',
  ARCHIVED: 'Archived',
};

export default function StatusBadge({ status }) {
  const className = `status status-${status.toLowerCase().replace('_', '-')}`;
  return <span className={className}>{LABELS[status] ?? status}</span>;
}