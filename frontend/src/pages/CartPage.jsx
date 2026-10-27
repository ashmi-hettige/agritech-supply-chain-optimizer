/**
 * The buyer's cart: change kilos, remove items, enter the delivery address and place the order.
 * Items from different farms become separate orders, because each farm delivers its own.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import BackButton from '../components/BackButton';
import FormField from '../components/FormField';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import useToast from '../hooks/useToast';
import { DISTRICTS, DISTRICT_CENTRES } from '../constants/districts';
import { ORDERS_CHANGED_EVENT } from '../constants/orders';
import { formatKg, formatPrice } from '../utils/format';
import { validateCheckout, validateOrderQuantity } from '../utils/validation';
import './Orders.css';

// [{ farmerId, farmName, district, items: [...] }, ...] in the order items were added
function groupByFarm(items) {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.farmerId)) {
      groups.set(item.farmerId, { farmerId: item.farmerId, farmName: item.farmName, district: item.district, items: [] });
    }
    groups.get(item.farmerId).items.push(item);
  });
  return [...groups.values()];
}

export default function CartPage() {
  const { user } = useAuth();
  const cart = useCart();
  const showToast = useToast();
  const navigate = useNavigate();

  // what the buyer is typing in each kg box, by listing id
  const [drafts, setDrafts] = useState({});
  const [form, setForm] = useState({ deliveryAddress: '', district: user.district ?? '' });
  const [exactLocation, setExactLocation] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const groups = groupByFarm(cart.items);
  const totalKg = cart.items.reduce((sum, item) => sum + item.quantityKg, 0);
  const rowErrors = Object.fromEntries(cart.items.map((item) => [
    item.listingId,
    item.listingId in drafts ? validateOrderQuantity(drafts[item.listingId], item.availableKg) : '',
  ]));
  const hasRowErrors = Object.values(rowErrors).some(Boolean);

  function changeQuantity(item, text) {
    setDrafts((current) => ({ ...current, [item.listingId]: text }));
    if (!validateOrderQuantity(text, item.availableKg)) {
      cart.updateQuantity(item.listingId, text);
    }
  }

  function remove(item) {
    cart.removeItem(item.listingId);
    showToast(`${item.cropName} removed from your cart`);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    if (name === 'district') setExactLocation(null);
  }

  function shareExactLocation() {
    if (!navigator.geolocation) {
      showToast('Your browser cannot share its location. The district centre is used instead.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => setExactLocation([position.coords.latitude, position.coords.longitude]),
      () => showToast('Location permission was denied. The district centre is used instead.', 'error'),
    );
  }

  async function placeOrder(event) {
    event.preventDefault();
    setServerError('');

    const found = validateCheckout(form);
    setErrors(found);
    if (Object.keys(found).length > 0 || hasRowErrors) return;

    const [deliveryLat, deliveryLng] = exactLocation ?? DISTRICT_CENTRES[form.district];
    const address = form.deliveryAddress.trim();
    const deliveryAddress = address.toLowerCase().includes(form.district.toLowerCase())
      ? address
      : `${address}, ${form.district}`;

    setSubmitting(true);
    try {
      const { data: orders } = await api.post('/orders', {
        items: cart.items.map((item) => ({ listingId: item.listingId, quantityKg: item.quantityKg })),
        deliveryAddress,
        deliveryLat,
        deliveryLng,
      });
      cart.clear();
      window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
      showToast(orders.length === 1
        ? `Order #${orders[0].id} placed. Pay cash on delivery.`
        : `${orders.length} orders placed, one for each farm. Pay cash on delivery.`);
      navigate('/orders');
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="market-page">
      <div className="page-title-row">
        <BackButton to="/marketplace" label="Back to marketplace" />
        <h1>Your cart</h1>
      </div>

      {cart.count === 0 && (
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p className="text-muted">Add produce from the marketplace, then come back here to order.</p>
          <Link to="/marketplace" className="btn btn-primary">Browse produce</Link>
        </div>
      )}

      {cart.count > 0 && (
        <div className="cart-layout">
          <div className="cart-groups">
            {groups.map((group) => (
              <section key={group.farmerId} className="cart-group" aria-label={group.farmName}>
                <header className="cart-group-head">
                  <h2>{group.farmName}</h2>
                  <span className="text-muted">{group.district}</span>
                </header>

                {group.items.map((item) => {
                  const text = drafts[item.listingId] ?? String(item.quantityKg);
                  const error = rowErrors[item.listingId];
                  return (
                    <div key={item.listingId} className="cart-row">
                      <img src={item.cropImageUrl} alt="" />
                      <div className="cart-row-name">
                        <Link to={`/listings/${item.listingId}`}><strong>{item.cropName}</strong></Link>
                        <span>Grade {item.grade} · {formatPrice(item.pricePerKg)}/kg</span>
                      </div>
                      <div className="cart-row-qty">
                        <label className="sr-only" htmlFor={`qty-${item.listingId}`}>Kilos of {item.cropName}</label>
                        <input
                          id={`qty-${item.listingId}`}
                          className={`input ${error ? 'input-invalid' : ''}`}
                          inputMode="decimal"
                          value={text}
                          onChange={(event) => changeQuantity(item, event.target.value)}
                          aria-invalid={Boolean(error)}
                        />
                        <span>kg</span>
                      </div>
                      <strong className="cart-row-total">{formatPrice(item.pricePerKg * item.quantityKg)}</strong>
                      <button type="button" className="link-button remove-button" onClick={() => remove(item)}>
                        Remove
                      </button>
                      {error && <p className="field-error cart-row-error">{error}</p>}
                    </div>
                  );
                })}
              </section>
            ))}
            {groups.length > 1 && (
              <p className="field-hint">
                This cart becomes {groups.length} orders, one for each farm. Each farm confirms and delivers its own order.
              </p>
            )}
          </div>

          <aside className="checkout-panel">
            <form className="form" onSubmit={placeOrder} noValidate>
              <h2>Delivery</h2>
              {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

              <FormField id="deliveryAddress" label="Delivery address" placeholder="No. 12, Galle Road, Colombo 03"
                value={form.deliveryAddress} onChange={handleChange} error={errors.deliveryAddress} />
              <FormField id="district" label="District" as="select" value={form.district} onChange={handleChange}
                error={errors.district}>
                <option value="">Choose a district</option>
                {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
              </FormField>

              <div className="location-choice">
                <span>
                  {exactLocation
                    ? 'Delivering to your current location'
                    : `Delivering near ${form.district || 'the district'} town centre`}
                </span>
                {exactLocation
                  ? <button type="button" className="link-button" onClick={() => setExactLocation(null)}>Use town centre</button>
                  : <button type="button" className="link-button" onClick={shareExactLocation}>Use my exact location</button>}
              </div>

              <dl className="checkout-summary">
                <div><dt>Items</dt><dd>{cart.count}</dd></div>
                <div><dt>Weight</dt><dd>{formatKg(totalKg)}</dd></div>
                <div className="checkout-total"><dt>Total</dt><dd>{formatPrice(cart.totalAmount)}</dd></div>
              </dl>
              <p className="field-hint">Pay cash when the produce arrives. Prices and stock are checked again when you order.</p>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting || hasRowErrors}>
                {submitting ? 'Placing order…' : 'Place order'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}