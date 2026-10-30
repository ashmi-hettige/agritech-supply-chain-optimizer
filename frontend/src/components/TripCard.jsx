/**
 * One delivery trip: vehicle, load against capacity, distance and the stops in driving order.
 * @author Ashmi Hettige
 */
import { ORDER_STATUS_LABELS, SLOT_LABELS } from '../constants/orders';
import { formatDate, formatKg } from '../utils/format';
import { MapPinIcon, PhoneIcon, TruckIcon } from './Icons';

const TRIP_LABELS = { PLANNED: 'Planned', IN_PROGRESS: 'On the road', COMPLETED: 'Completed' };

export default function TripCard({ trip, showTransporter, children }) {
  const loadShare = Math.min(100, (Number(trip.totalLoadKg) / Number(trip.capacityKg)) * 100);

  return (
    <article className="trip-card">
      <header className="trip-head">
        <span className="trip-icon" aria-hidden="true"><TruckIcon size={22} /></span>
        <div>
          <h2>Trip #{trip.id} · {trip.plateNo}</h2>
          <p className="text-muted">
            {formatDate(trip.tripDate)}{trip.slot ? `, ${SLOT_LABELS[trip.slot].split(' (')[0].toLowerCase()}` : ''} · {trip.vehicleType}{trip.refrigerated ? ' (refrigerated)' : ''}
            {showTransporter ? ` · ${trip.transporterName}` : ''}
          </p>
        </div>
        <span className={`status trip-${trip.status.toLowerCase().replace('_', '-')}`}>{TRIP_LABELS[trip.status]}</span>
      </header>

      <div className="trip-load">
        <div className="trip-load-text">
          <span>Load {formatKg(trip.totalLoadKg)} of {formatKg(trip.capacityKg)}</span>
          <span>{trip.totalDistanceKm} km by road</span>
        </div>
        <div className="trip-load-track" aria-hidden="true">
          <div className="trip-load-fill" style={{ width: `${loadShare}%` }} />
        </div>
      </div>

      <ol className="trip-stops">
        {trip.stops.map((stop) => (
          <li key={stop.orderId}>
            <span className="stop-number" aria-hidden="true">{stop.sequence}</span>
            <div className="stop-body">
              <strong>Order #{stop.orderId} · {stop.buyerName}</strong>
              <span>{stop.items} · {formatKg(stop.kg)}</span>
              <span className="stop-line">Collect from {stop.pickupFrom}</span>
              <span className="stop-line"><MapPinIcon size={14} /> {stop.deliveryAddress}</span>
              {stop.buyerPhone && (
                <span className="stop-line"><PhoneIcon size={14} /> <a href={`tel:${stop.buyerPhone}`}>{stop.buyerPhone}</a></span>
              )}
            </div>
            <span className="stop-status">{ORDER_STATUS_LABELS[stop.orderStatus] ?? stop.orderStatus}</span>
          </li>
        ))}
      </ol>

      {children}
    </article>
  );
}
