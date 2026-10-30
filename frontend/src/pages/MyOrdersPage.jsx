/**
 * Buyer's orders, newest first, with progress and a cancel button while the farmer has not replied.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import OrderActions from '../components/OrderActions';
import OrderCard from '../components/OrderCard';
import './Orders.css';

export default function MyOrdersPage() {
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ count: -1, orders: [], error: '' });
  const loading = result.count !== reloadCount;

  useEffect(() => {
    let cancelled = false;
    api
      .get('/orders/mine')
      .then((response) => {
        if (!cancelled) setResult({ count: reloadCount, orders: response.data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setResult({ count: reloadCount, orders: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);
  const { orders } = result;

  return (
    <div className="market-page orders-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Buyer</p>
          <h1>My orders</h1>
        </div>
        <Link to="/marketplace" className="btn btn-outline">Browse produce</Link>
      </div>

      {loading && orders.length === 0 && <p className="text-muted">Loading your orders…</p>}
      {result.error && <div className="alert alert-error" role="alert">{result.error}</div>}

      {!loading && !result.error && orders.length === 0 && (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p className="text-muted">Fill your cart in the marketplace and place your first order.</p>
          <Link to="/marketplace" className="btn btn-primary">Browse produce</Link>
        </div>
      )}

      <div className="order-list">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} viewer="BUYER">
            <OrderActions order={order} viewer="BUYER" onChanged={reload} />
          </OrderCard>
        ))}
      </div>
    </div>
  );
}