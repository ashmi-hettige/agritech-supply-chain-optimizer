/**
 * Full details of one listing, with a box where buyers choose how many kg to add to the cart.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import BackButton from '../components/BackButton';
import FreshnessBadge from '../components/FreshnessBadge';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import useToast from '../hooks/useToast';
import { formatDate, formatKg, formatPrice } from '../utils/format';
import { validateOrderQuantity } from '../utils/validation';
import './Marketplace.css';

const QUICK_AMOUNTS = [10, 25, 50, 100];

function OrderBox({ listing }) {
  const { user } = useAuth();
  const cart = useCart();
  const showToast = useToast();
  const location = useLocation();

  const inCart = cart.getItem(listing.id);
  const [quantity, setQuantity] = useState(inCart ? String(inCart.quantityKg) : '');
  const [error, setError] = useState('');

  if (listing.status !== 'AVAILABLE' || listing.daysLeft < 0) {
    return <p className="order-box order-box-note">This produce is not on sale right now.</p>;
  }

  if (!user) {
    return (
      <div className="order-box">
        <p><strong>Want to buy this?</strong> Log in with a buyer account to order.</p>
        <div className="order-box-actions">
          <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary">Log in</Link>
          <Link to="/register?role=BUYER" className="btn btn-outline">Join free</Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'BUYER') {
    return <p className="order-box order-box-note">Only buyer accounts can order produce.</p>;
  }

  const problem = quantity === '' ? '' : validateOrderQuantity(quantity, listing.availableKg);
  const total = quantity !== '' && !problem ? Number(quantity) * Number(listing.pricePerKg) : null;

  function handleSubmit(event) {
    event.preventDefault();
    const found = validateOrderQuantity(quantity, listing.availableKg);
    setError(found);
    if (found) return;

    cart.setItem(listing, quantity);
    showToast(inCart
      ? `Cart updated: ${quantity} kg ${listing.cropName.toLowerCase()}`
      : `Added ${quantity} kg ${listing.cropName.toLowerCase()} to your cart`);
  }

  return (
    <form className="order-box" onSubmit={handleSubmit} noValidate>
      <label htmlFor="order-quantity" className="field-label">How many kg?</label>
      <div className="quick-amounts">
        {QUICK_AMOUNTS.filter((kg) => kg <= Number(listing.availableKg)).map((kg) => (
          <button
            key={kg}
            type="button"
            className={`filter-chip ${quantity === String(kg) ? 'on' : ''}`}
            onClick={() => { setQuantity(String(kg)); setError(''); }}
          >
            {kg} kg
          </button>
        ))}
      </div>
      <div className="order-row">
        <input
          id="order-quantity"
          className={`input ${error ? 'input-invalid' : ''}`}
          inputMode="decimal"
          placeholder="e.g. 40"
          value={quantity}
          onChange={(event) => { setQuantity(event.target.value); setError(''); }}
          aria-invalid={Boolean(error)}
          aria-describedby="order-quantity-help"
        />
        <button type="submit" className="btn btn-primary">{inCart ? 'Update cart' : 'Add to cart'}</button>
      </div>
      <p id="order-quantity-help" className={error ? 'field-error' : 'field-hint'}>
        {error || (total !== null ? `Total ${formatPrice(total)} · cash on delivery` : `Up to ${formatKg(listing.availableKg)}`)}
      </p>
      {inCart && (
        <p className="in-cart-note">
          {formatKg(inCart.quantityKg)} in your cart · <Link to="/cart">Go to cart</Link>
        </p>
      )}
    </form>
  );
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, listing: null, error: '' });
  const loading = result.id !== id;

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/listings/${id}`)
      .then((response) => {
        if (!cancelled) setResult({ id, listing: response.data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setResult({ id, listing: null, error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const { listing } = result;

  return (
    <div className="market-page">
      <div className="detail-back">
        <BackButton to="/marketplace" label="Back to marketplace" />
      </div>

      {loading && <p className="text-muted">Loading listing…</p>}
      {!loading && result.error && <div className="alert alert-error" role="alert">{result.error}</div>}

      {!loading && listing && (
        <article className="detail">
          <div className="detail-photo">
            <img src={listing.cropImageUrl} alt={listing.cropName} />
            <FreshnessBadge label={listing.freshnessLabel} daysLeft={listing.daysLeft} className="photo-badge" />
          </div>

          <div className="detail-info">
            <div>
              <p className="eyebrow">Grade {listing.grade}</p>
              <h1>{listing.cropName}</h1>
              <p className="text-muted">{listing.farmName ?? listing.farmerName} · {listing.district}</p>
            </div>

            <p className="detail-price">{formatPrice(listing.pricePerKg)}<small> /kg</small></p>

            <dl className="detail-facts">
              <div><dt>Available</dt><dd>{formatKg(listing.availableKg)}</dd></div>
              <div><dt>Farmer</dt><dd>{listing.farmerName}</dd></div>
              <div><dt>Harvested</dt><dd>{formatDate(listing.harvestDate)}</dd></div>
              <div><dt>Best before</dt><dd>{formatDate(listing.expiryDate)}</dd></div>
            </dl>

            {/* key: a fresh box (and quantity) for each listing */}
            <OrderBox key={listing.id} listing={listing} />
          </div>
        </article>
      )}
    </div>
  );
}