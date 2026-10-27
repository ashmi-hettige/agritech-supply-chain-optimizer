/**
 * An order's status as text with a coloured dot, e.g. "Waiting for farmer".
 * @author Ashmi Hettige
 */
import { ORDER_STATUS_LABELS } from '../constants/orders';

export default function OrderStatusBadge({ status, labels = ORDER_STATUS_LABELS }) {
  const className = `status order-${status.toLowerCase().replace('_', '-')}`;
  return <span className={className}>{labels[status] ?? status}</span>;
}