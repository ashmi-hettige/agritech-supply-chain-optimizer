/**
 * Transporter: farmers' delivery requests to accept or decline, and open orders that would fit
 * the free space in trips already planned.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client';
import { SLOT_LABELS } from '../../constants/orders';
import useToast from '../../hooks/useToast';
import { formatDate, formatKg } from '../../utils/format';
import './Transport.css';

function slotText(date, slot) {
  return `${formatDate(date)}, ${SLOT_LABELS[slot].split(' (')[0].toLowerCase()}`;
}

function OrderLine({ order }) {
  return (
    <>
      <strong>Order #{order.orderId} · {formatKg(order.kg)}{order.needsColdChain ? ' · needs refrigeration' : ''}</strong>
      <span>{order.items}</span>
      <span>Collect from {order.farmerName}, {order.pickupDistrict}{order.farmerPhone ? ` · ${order.farmerPhone}` : ''}</span>
      <span>Deliver to {order.deliveryAddress}</span>
    </>
  );
}

export default function TransportRequestsPage() {
  const showToast = useToast();
  const [reloadCount, setReloadCount] = useState(0);
  const [data, setData] = useState({ count: -1, requests: [], suggestions: [], error: '' });
  const [busy, setBusy] = useState(null);
  const loading = data.count !== reloadCount;

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/transporter/requests'), api.get('/transporter/suggestions')])
      .then(([requests, suggestions]) => {
        if (!cancelled) {
          setData({ count: reloadCount, requests: requests.data, suggestions: suggestions.data, error: '' });
        }
      })
      .catch((error) => {
        if (!cancelled) setData({ count: reloadCount, requests: [], suggestions: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  async function decide(request, accept) {
    setBusy(`r${request.id}`);
    try {
      await api.patch(`/transporter/requests/${request.id}`, { accept });
      showToast(accept
        ? `Order #${request.orderId} added to your trip on ${slotText(request.tripDate, request.slot)}`
        : `Declined order #${request.orderId}. The farmer will choose someone else.`);
      reload();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusy(null);
    }
  }

  async function take(trip, order) {
    setBusy(`t${trip.tripId}-${order.orderId}`);
    try {
      await api.post(`/transporter/trips/${trip.tripId}/orders/${order.orderId}`);
      showToast(`Order #${order.orderId} added to trip #${trip.tripId}`);
      reload();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="requests-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Transporter</p>
          <h1 id="requests-title">Requests</h1>
        </div>
        <Link to="/transporter/trips" className="btn btn-outline">My trips</Link>
      </div>

      {data.error && <div className="alert alert-error" role="alert">{data.error}</div>}
      {loading && data.count < 0 && <p className="text-muted">Loading…</p>}

      <h2 className="section-title">From farmers</h2>
      {!loading && data.requests.length === 0 && (
        <p className="text-muted request-list">No requests right now.</p>
      )}
      <div className="request-list">
        {data.requests.map((request) => (
          <article key={request.id} className="request-card">
            <div className="request-text">
              <span className="request-when">{slotText(request.tripDate, request.slot)}</span>
              <OrderLine order={request.order} />
            </div>
            <div className="order-actions">
              <button type="button" className="btn btn-outline-danger" disabled={busy !== null}
                onClick={() => decide(request, false)}>
                Decline
              </button>
              <button type="button" className="btn btn-primary" disabled={busy !== null}
                onClick={() => decide(request, true)}>
                {busy === `r${request.id}` ? 'Please wait…' : 'Accept'}
              </button>
            </div>
          </article>
        ))}
      </div>

      <h2 className="section-title">Fill your free space</h2>
      <p className="field-hint">
        Confirmed orders that still need a lorry and fit in a trip you already have, heaviest first.
      </p>
      {!loading && data.suggestions.length === 0 && (
        <p className="text-muted">Nothing to suggest. Suggestions appear once you have a planned trip with room left.</p>
      )}
      {data.suggestions.map((trip) => (
        <section key={trip.tripId} className="suggestion" aria-label={`Trip ${trip.tripId}`}>
          <div className="suggestion-head">
            <strong>Trip #{trip.tripId} · {trip.plateNo} · {slotText(trip.tripDate, trip.slot)}</strong>
            <span>{formatKg(trip.spaceLeftKg)} free{trip.refrigerated ? ' · refrigerated' : ''}</span>
          </div>
          {trip.orders.map((order) => (
            <article key={order.orderId} className="request-card">
              <div className="request-text"><OrderLine order={order} /></div>
              <button type="button" className="btn btn-primary btn-small" disabled={busy !== null}
                onClick={() => take(trip, order)}>
                {busy === `t${trip.tripId}-${order.orderId}` ? 'Adding…' : 'Add to this trip'}
              </button>
            </article>
          ))}
        </section>
      ))}
    </section>
  );
}
