/**
 * Farmer's incoming orders in tabs: new orders to confirm or reject, confirmed ones to deliver
 * (book a transporter, or mark as delivered when the farmer delivers it).
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import OrderActions from '../components/OrderActions';
import OrderCard from '../components/OrderCard';
import TransportPanel from '../components/TransportPanel';
import { ORDER_STATUS_LABELS } from '../constants/orders';
import './Orders.css';
import './transporter/Transport.css';

const FARMER_LABELS = { ...ORDER_STATUS_LABELS, PLACED: 'New order' };

const TABS = [
  { key: 'NEW', label: 'New', statuses: ['PLACED'], empty: 'No new orders right now.' },
  { key: 'CONFIRMED', label: 'To deliver', statuses: ['CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'], empty: 'Nothing waiting for delivery.' },
  { key: 'DELIVERED', label: 'Delivered', statuses: ['DELIVERED'], empty: 'No delivered orders yet.' },
  { key: 'CLOSED', label: 'Rejected or cancelled', statuses: ['REJECTED', 'CANCELLED'], empty: 'Nothing here.' },
];

export default function IncomingOrdersPage() {
  const [tab, setTab] = useState('NEW');
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ count: -1, orders: [], requests: [], error: '' });
  const loading = result.count !== reloadCount;

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get('/orders/incoming'), api.get('/delivery/requests')])
      .then(([orders, requests]) => {
        if (!cancelled) setResult({ count: reloadCount, orders: orders.data, requests: requests.data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setResult({ count: reloadCount, orders: [], requests: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);
  const { orders } = result;
  // requests come newest first, so the first one found is the latest for that order
  const latestRequest = (orderId) => result.requests.find((request) => request.orderId === orderId);
  const activeTab = TABS.find((item) => item.key === tab);
  const shown = orders.filter((order) => activeTab.statuses.includes(order.status));

  return (
    <section aria-labelledby="incoming-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Farmer</p>
          <h1 id="incoming-title">Incoming orders</h1>
        </div>
      </div>

      <div className="tab-row" role="group" aria-label="Show orders">
        {TABS.map((item) => {
          const count = orders.filter((order) => item.statuses.includes(order.status)).length;
          return (
            <button
              key={item.key}
              type="button"
              className={`tab-chip ${tab === item.key ? 'on' : ''}`}
              aria-pressed={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {item.label} <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {loading && orders.length === 0 && <p className="text-muted">Loading orders…</p>}
      {result.error && <div className="alert alert-error" role="alert">{result.error}</div>}
      {!loading && !result.error && shown.length === 0 && (
        <div className="empty-state"><p className="text-muted">{activeTab.empty}</p></div>
      )}

      <div className="order-list">
        {shown.map((order) => (
          <OrderCard key={order.id} order={order} viewer="FARMER" labels={FARMER_LABELS}>
            {order.status === 'CONFIRMED' && (
              <TransportPanel order={order} request={latestRequest(order.id)} onChanged={reload} />
            )}
            <OrderActions order={order} viewer="FARMER" onChanged={reload} />
          </OrderCard>
        ))}
      </div>
    </section>
  );
}