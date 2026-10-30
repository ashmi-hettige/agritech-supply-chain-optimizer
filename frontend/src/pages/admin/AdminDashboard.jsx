/**
 * Logistics admin dashboard: platform numbers and shortcuts to the admin pages.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client';
import { ArrowRightIcon } from '../../components/Icons';
import { formatPrice } from '../../utils/format';
import '../Farmer.css';
import './Admin.css';

const SHORTCUTS = [
  { to: '/admin/prices', title: 'Daily prices', text: 'Enter today’s prices from each economic centre.' },
  { to: '/admin/users', title: 'Users', text: 'Find accounts and disable ones that break the rules.' },
  { to: '/admin/crops', title: 'Crops', text: 'Add crops and set how long each one keeps.' },
  { to: '/admin/centres', title: 'Economic centres', text: 'Add centres and their map location.' },
];

export default function AdminDashboard({ user }) {
  const [result, setResult] = useState({ stats: null, error: '' });

  useEffect(() => {
    api
      .get('/admin/stats')
      .then(({ data }) => setResult({ stats: data, error: '' }))
      .catch((error) => setResult({ stats: null, error: getErrorMessage(error) }));
  }, []);

  const { stats } = result;
  const show = (value) => (stats ? value : '–');

  return (
    <section className="admin-dashboard" aria-labelledby="dashboard-title">
      <p className="eyebrow">Logistics admin</p>
      <h1 id="dashboard-title" className="admin-title">Hello, {user.fullName.split(' ')[0]}</h1>

      {result.error && <div className="alert alert-error" role="alert">{result.error}</div>}

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-title">Farmers</span>
          <span className="stat-number">{show(stats?.farmers)}</span>
          <span className="stat-note">{show(stats?.buyers)} buyers · {show(stats?.transporters)} transporters</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Listings on sale</span>
          <span className="stat-number">{show(stats?.activeListings)}</span>
          <span className="stat-note">{show(stats?.crops)} crops · {show(stats?.centres)} centres</span>
        </div>
        <div className="stat-card">
          <span className="stat-title">Delivered orders</span>
          <span className="stat-number">{show(stats?.ordersDelivered)}</span>
          <span className="stat-note">{stats ? formatPrice(stats.deliveredValue) : '–'} in total</span>
        </div>
        <div className={`stat-card ${stats && stats.pricesToday === 0 ? 'warning' : ''}`}>
          <span className="stat-title">Prices entered today</span>
          <span className="stat-number">{show(stats?.pricesToday)}</span>
          <Link to="/admin/prices" className="stat-link">Enter prices <ArrowRightIcon size={15} /></Link>
        </div>
      </div>

      <div className="quick-actions">
        {SHORTCUTS.map((item) => (
          <Link key={item.to} to={item.to} className="quick-action card">
            <strong>{item.title}</strong>
            <span className="text-muted">{item.text}</span>
            <span className="quick-action-arrow"><ArrowRightIcon size={18} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
