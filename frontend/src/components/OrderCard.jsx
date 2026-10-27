/**
 * One order with its items, delivery address and total.
 * Buyers see the farm and a progress line; farmers see the buyer and their phone number.
 * @author Ashmi Hettige
 */
import { ORDER_STEPS } from '../constants/orders';
import { formatDateTime, formatKg, formatPrice } from '../utils/format';
import { MapPinIcon, PhoneIcon } from './Icons';
import OrderStatusBadge from './OrderStatusBadge';

const STEP_LABELS = { PLACED: 'Placed', CONFIRMED: 'Confirmed by farmer', DELIVERED: 'Delivered' };

// orders on a delivery trip count as "confirmed" on the buyer's progress line
function stepIndex(status) {
  if (status === 'PLACED') return 0;
  if (status === 'DELIVERED') return 2;
  return 1;
}

function OrderSteps({ status }) {
  if (status === 'REJECTED') {
    return <p className="order-note">The farmer could not take this order. Nothing to pay.</p>;
  }
  if (status === 'CANCELLED') {
    return <p className="order-note">You cancelled this order. Nothing to pay.</p>;
  }
  const current = stepIndex(status);
  return (
    <ol className="order-steps" aria-label="Order progress">
      {ORDER_STEPS.map((step, index) => (
        <li key={step} className={index <= current ? 'done' : ''} aria-current={index === current ? 'step' : undefined}>
          {STEP_LABELS[step]}
        </li>
      ))}
    </ol>
  );
}

export default function OrderCard({ order, viewer, labels, children }) {
  const otherPerson = viewer === 'BUYER' ? order.farmName ?? order.farmerName : order.buyerName;
  const phone = viewer === 'BUYER' ? order.farmerPhone : order.buyerPhone;

  return (
    <article className="order-card">
      <header className="order-card-head">
        <div>
          <h2>Order #{order.id} · {otherPerson}</h2>
          <p className="text-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} labels={labels} />
      </header>

      {viewer === 'BUYER' && <OrderSteps status={order.status} />}

      <ul className="order-items">
        {order.items.map((item) => (
          <li key={item.listingId}>
            <img src={item.cropImageUrl} alt="" />
            <div>
              <strong>{item.cropName}</strong>
              <span>Grade {item.grade} · {formatKg(item.quantityKg)} × {formatPrice(item.unitPrice)}</span>
            </div>
            <span className="order-line-total">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <footer className="order-card-foot">
        <div className="order-meta">
          <span><MapPinIcon size={16} /> {order.deliveryAddress}</span>
          {phone && (
            <span><PhoneIcon size={16} /> <a href={`tel:${phone}`}>{phone}</a></span>
          )}
        </div>
        <div className="order-total">
          <span>{formatKg(order.totalKg)} · cash on delivery</span>
          <strong>{formatPrice(order.totalAmount)}</strong>
        </div>
      </footer>

      {children}
    </article>
  );
}