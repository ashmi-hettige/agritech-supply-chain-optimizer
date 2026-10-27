/**
 * Farmer's dashboard: greeting banner, four stat cards, latest listings, a price tip
 * and new orders to confirm or reject. Sold and Revenue come from this month's delivered orders.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import FreshnessBadge from '../components/FreshnessBadge';
import OrderActions from '../components/OrderActions';
import StatusBadge from '../components/StatusBadge';
import { ArrowRightIcon, PlusIcon } from '../components/Icons';
import { formatKg, formatPrice, timeAgo } from '../utils/format';
import './Farmer.css';

const PREVIEW_ROWS = 4;
const NEW_ORDER_ROWS = 3;
const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date());

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');
}

// "Dambulla Dedicated Economic Centre" -> "Dambulla"
function shortCentreName(name) {
  return name.replace(/\s*(Dedicated\s+)?Economic Centre$/i, '');
}

function PriceTip({ listing }) {
  const [centres, setCentres] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/prices/latest', { params: { cropId: listing.cropId } })
      .then(({ data }) => {
        if (!cancelled) setCentres(data);
      })
      .catch(() => {
        // the tip is optional; the rest of the dashboard still works
      });
    return () => {
      cancelled = true;
    };
  }, [listing.cropId]);

  if (centres.length === 0) {
    return null;
  }

  // value of the farmer's available stock at each centre, highest first
  const kg = Number(listing.availableKg);
  const values = centres
    .map((centre) => ({ name: shortCentreName(centre.centreName), value: Number(centre.latestAvgPrice) * kg }))
    .sort((a, b) => b.value - a.value);
  const best = values[0];
  const lowest = values[values.length - 1];

  return (
    <section className="tip-panel" aria-labelledby="tip-title">
      <div>
        <p className="tip-eyebrow">Price tip</p>
        <h2 id="tip-title">Sell your {listing.cropName.toLowerCase()} at {best.name}</h2>
        {values.length > 1 && (
          <p className="tip-note">
            {formatPrice(Math.round(best.value - lowest.value))} more than {lowest.name} for {formatKg(kg)}
          </p>
        )}
      </div>
      <ul className="tip-list">
        {values.slice(0, 4).map((centre, index) => (
          <li key={centre.name} className={index === 0 ? 'best' : ''}>
            <span>{centre.name}</span>
            <span>{Math.round(centre.value).toLocaleString('en-LK')}</span>
          </li>
        ))}
      </ul>
      <p className="tip-footnote">Today&apos;s prices in LKR, before transport cost.</p>
    </section>
  );
}

const EMPTY_SUMMARY = { soldKg: 0, revenue: 0, deliveredOrders: 0, newOrders: 0 };

// "80 kg beans, 20 kg leeks"
function itemSummary(order) {
  return order.items.map((item) => `${formatKg(item.quantityKg)} ${item.cropName.toLowerCase()}`).join(', ');
}

export default function FarmerDashboard({ user }) {
  const [reloadCount, setReloadCount] = useState(0);
  const [data, setData] = useState({
    count: -1, listings: [], farmName: '', summary: EMPTY_SUMMARY, newOrders: [], error: '',
  });
  const loaded = data.count >= 0;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get('/listings/mine'),
      api.get('/farms'),
      api.get('/orders/summary'),
      api.get('/orders/incoming'),
    ])
      .then(([listingResponse, farmResponse, summaryResponse, orderResponse]) => {
        const farm = farmResponse.data.find((item) => item.farmerId === user.id);
        if (!cancelled) {
          setData({
            count: reloadCount,
            listings: listingResponse.data,
            farmName: farm?.farmName ?? '',
            summary: summaryResponse.data,
            newOrders: orderResponse.data.filter((order) => order.status === 'PLACED'),
            error: '',
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setData({
            count: reloadCount, listings: [], farmName: '', summary: EMPTY_SUMMARY, newOrders: [],
            error: getErrorMessage(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);
  const { listings, summary } = data;
  const active = listings.filter((listing) => listing.status === 'AVAILABLE');
  const availableKg = active.reduce((total, listing) => total + Number(listing.availableKg), 0);
  const expiringSoon = active.filter((listing) => listing.daysLeft <= 2);
  // the tip is about the crop the farmer has most of right now
  const biggestListing = active.reduce(
    (biggest, listing) => (!biggest || Number(listing.availableKg) > Number(biggest.availableKg) ? listing : biggest),
    null,
  );

  return (
    <div className="farmer-dashboard">
      <section className="farm-hero" aria-labelledby="dashboard-title">
        <img src="/images/hero-fields.jpg" alt="" />
        <div className="farm-hero-content">
          <div className="farm-hero-person">
            <span className="hero-avatar" aria-hidden="true">{initials(user.fullName)}</span>
            <div>
              <h1 id="dashboard-title">{greeting()}, {user.fullName.split(' ')[0]}</h1>
              <p>{[data.farmName, user.district].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <Link to="/farmer/listings/new" className="btn btn-lime btn-lg"><PlusIcon size={18} /> Add listing</Link>
        </div>
      </section>

      {data.error && <div className="alert alert-error" role="alert">{data.error}</div>}

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-title">Active listings</span>
          <span className="stat-number">{loaded ? active.length : '–'}</span>
          <span className="stat-note">{formatKg(availableKg)} available</span>
        </div>
        <div className="stat-card">
          <div className="stat-title-row">
            <span className="stat-title">Sold</span>
            <span className="month-pill">{monthName}</span>
          </div>
          <span className="stat-number">{formatKg(summary.soldKg)}</span>
          <span className="stat-note">
            {summary.newOrders > 0
              ? <Link to="/farmer/orders">{summary.newOrders} new {summary.newOrders === 1 ? 'order' : 'orders'} waiting</Link>
              : 'From delivered orders'}
          </span>
        </div>
        <div className="stat-card">
          <div className="stat-title-row">
            <span className="stat-title">Revenue</span>
            <span className="month-pill">{monthName}</span>
          </div>
          <span className="stat-number">{formatPrice(summary.revenue)}</span>
          <span className="stat-note">
            {summary.deliveredOrders} {summary.deliveredOrders === 1 ? 'order' : 'orders'} delivered
          </span>
        </div>
        <div className="stat-card warning">
          <span className="stat-title">Expiring within 2 days</span>
          <span className="stat-number">
            {loaded ? `${expiringSoon.length} ${expiringSoon.length === 1 ? 'listing' : 'listings'}` : '–'}
          </span>
          <Link to="/farmer/listings" className="stat-link">Review <ArrowRightIcon size={15} /></Link>
        </div>
      </div>

      <div className="dashboard-row">
        <section className="panel listings-panel" aria-labelledby="latest-title">
          <div className="panel-head">
            <h2 id="latest-title">My listings</h2>
            <Link to="/farmer/listings">See all</Link>
          </div>

          {loaded && listings.length === 0 && (
            <p className="text-muted">
              You have no listings yet. <Link to="/farmer/listings/new">Add your first harvest</Link>.
            </p>
          )}

          {listings.length > 0 && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Crop</th>
                    <th scope="col">Available</th>
                    <th scope="col">Price</th>
                    <th scope="col">Freshness</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.slice(0, PREVIEW_ROWS).map((listing) => (
                    <tr key={listing.id}>
                      <td>
                        <div className="crop-cell">
                          <img src={listing.cropImageUrl} alt="" />
                          <strong>{listing.cropName} · Grade {listing.grade}</strong>
                        </div>
                      </td>
                      <td>{formatKg(listing.availableKg)}</td>
                      <td>{formatPrice(listing.pricePerKg)}/kg</td>
                      <td><FreshnessBadge label={listing.freshnessLabel} daysLeft={listing.daysLeft} /></td>
                      <td><StatusBadge status={listing.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {biggestListing && <PriceTip listing={biggestListing} />}
      </div>

      <section className="panel" aria-labelledby="new-orders-title">
        <div className="panel-head">
          <h2 id="new-orders-title">New orders</h2>
          <Link to="/farmer/orders">All orders</Link>
        </div>
        {loaded && data.newOrders.length === 0 && (
          <p className="text-muted">No new orders right now. Buyers' orders appear here for you to confirm.</p>
        )}
        {data.newOrders.slice(0, NEW_ORDER_ROWS).map((order) => (
          <div key={order.id} className="new-order-row">
            <div className="new-order-text">
              <strong>Order #{order.id} · {order.buyerName}, {order.deliveryAddress}</strong>
              <span>{itemSummary(order)} · {formatPrice(order.totalAmount)} · placed {timeAgo(order.createdAt)}</span>
            </div>
            <OrderActions order={order} viewer="FARMER" onChanged={reload} />
          </div>
        ))}
      </section>
    </div>
  );
}