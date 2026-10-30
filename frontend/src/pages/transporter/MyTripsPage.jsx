/**
 * Transporter: trips planned for my vehicles. Start a trip when the lorry leaves,
 * and finish it when every stop is delivered.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client';
import TripCard from '../../components/TripCard';
import useToast from '../../hooks/useToast';
import './Transport.css';

export default function MyTripsPage() {
  const showToast = useToast();
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ count: -1, trips: [], error: '' });
  const [busyId, setBusyId] = useState(null);
  const loading = result.count !== reloadCount;

  useEffect(() => {
    let cancelled = false;
    api
      .get('/transporter/trips')
      .then(({ data }) => {
        if (!cancelled) setResult({ count: reloadCount, trips: data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setResult({ count: reloadCount, trips: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  async function changeStatus(trip, status) {
    setBusyId(trip.id);
    try {
      await api.patch(`/transporter/trips/${trip.id}/status`, { status });
      showToast(status === 'IN_PROGRESS'
        ? `Trip #${trip.id} started. Buyers have been told it is on the way.`
        : `Trip #${trip.id} finished. All its orders are delivered.`);
      setReloadCount((count) => count + 1);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const { trips } = result;

  return (
    <section aria-labelledby="trips-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Transporter</p>
          <h1 id="trips-title">My trips</h1>
        </div>
        <Link to="/transporter/vehicles" className="btn btn-outline">My vehicles</Link>
      </div>

      {loading && trips.length === 0 && <p className="text-muted">Loading trips…</p>}
      {result.error && <div className="alert alert-error" role="alert">{result.error}</div>}
      {!loading && !result.error && trips.length === 0 && (
        <div className="empty-state">
          <h2>No trips yet</h2>
          <p className="text-muted">The logistics admin plans trips from confirmed orders. Make sure your vehicles are added.</p>
          <Link to="/transporter/vehicles" className="btn btn-primary">Add a vehicle</Link>
        </div>
      )}

      <div className="trip-list">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip}>
            <div className="order-actions">
              {trip.status === 'PLANNED' && (
                <button type="button" className="btn btn-primary" disabled={busyId === trip.id}
                  onClick={() => changeStatus(trip, 'IN_PROGRESS')}>
                  Start trip
                </button>
              )}
              {trip.status === 'IN_PROGRESS' && (
                <button type="button" className="btn btn-primary" disabled={busyId === trip.id}
                  onClick={() => changeStatus(trip, 'COMPLETED')}>
                  All stops delivered
                </button>
              )}
            </div>
          </TripCard>
        ))}
      </div>
    </section>
  );
}
