/**
 * Admin: turn confirmed orders into delivery trips for a day.
 * The server loads vehicles with First-Fit Decreasing and orders each trip's stops by nearest neighbour.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import TripCard from '../../components/TripCard';
import useToast from '../../hooks/useToast';
import { todayIso } from '../../utils/format';
import '../transporter/Transport.css';
import './Admin.css';

export default function TripPlannerPage() {
  const showToast = useToast();
  const [date, setDate] = useState(todayIso());
  const [reloadCount, setReloadCount] = useState(0);
  const [data, setData] = useState({ key: null, trips: [], waiting: 0, error: '' });
  const [planning, setPlanning] = useState(false);
  const [notice, setNotice] = useState('');

  const key = `${date}|${reloadCount}`;
  const loading = data.key !== key;

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/admin/trips', { params: { date } }), api.get('/admin/trips/waiting')])
      .then(([trips, waiting]) => {
        if (!cancelled) setData({ key, trips: trips.data, waiting: waiting.data.confirmedOrders, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setData({ key, trips: [], waiting: 0, error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [date, key]);

  async function plan() {
    setPlanning(true);
    setNotice('');
    try {
      const { data: result } = await api.post('/admin/trips/plan', { tripDate: date });
      setNotice(result.unassignedOrderIds.length > 0
        ? `${result.message} Waiting: order ${result.unassignedOrderIds.map((id) => `#${id}`).join(', ')}.`
        : result.message);
      showToast(result.message);
      setReloadCount((count) => count + 1);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setPlanning(false);
    }
  }

  return (
    <section aria-labelledby="planner-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Logistics admin</p>
          <h1 id="planner-title">Trip planner</h1>
        </div>
      </div>

      <div className="card planner-bar">
        <label className="field">
          <span className="field-label">Delivery day</span>
          <input className="input" type="date" min={todayIso()} value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <div className="planner-waiting">
          <strong>{loading ? '–' : data.waiting}</strong>
          <span className="text-muted">confirmed orders waiting for a trip</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={plan} disabled={planning || data.waiting === 0}>
          {planning ? 'Planning…' : 'Plan trips'}
        </button>
        <p className="field-hint planner-how">
          Heaviest orders are loaded first onto the smallest vehicle they fit (cold-chain crops only on refrigerated
          vehicles). Each trip then visits the nearest delivery point next.
        </p>
      </div>

      {notice && <div className="alert planner-notice" role="status">{notice}</div>}
      {data.error && <div className="alert alert-error" role="alert">{data.error}</div>}

      {!loading && data.trips.length === 0 && !data.error && (
        <div className="empty-state"><p className="text-muted">No trips on this day yet.</p></div>
      )}

      <div className="trip-list">
        {data.trips.map((trip) => <TripCard key={trip.id} trip={trip} showTransporter />)}
      </div>
    </section>
  );
}
