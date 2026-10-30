/**
 * The buyer's cart: change kilos, remove items, choose the delivery point on a map and place the order.
 * Items from different farms become separate orders, because each farm delivers its own.
 * The buyer can order everything at once, or one farm at a time.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import BackButton from '../components/BackButton';
import FormField from '../components/FormField';
import MapPicker from '../components/MapPicker';
import useAuth from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import useToast from '../hooks/useToast';
import { DISTRICTS, DISTRICT_CENTRES } from '../constants/districts';
import { ORDERS_CHANGED_EVENT } from '../constants/orders';
import { formatKg, formatPrice } from '../utils/format';
import { findAddress } from '../utils/geocode';
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
  // delivery point; until the buyer drops a pin, the district's town centre is used
  const [point, setPoint] = useState({ lat: '', lng: '' });
  const [submittingFarm, setSubmittingFarm] = useState(null);
  // where the map should fly to, and whether the address was typed (look it up) or filled from the map
  const [deliveryFocus, setDeliveryFocus] = useState(null);
  const [addressSource, setAddressSource] = useState('typed');
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
    setAddressSource('typed');

    // a new district moves the pin to its town centre straight away; the address search refines it
    if (name === 'district' && DISTRICT_CENTRES[value]) {
      const [lat, lng] = DISTRICT_CENTRES[value];
      setDeliveryPoint(lat.toFixed(5), lng.toFixed(5));
      setDeliveryFocus([lat, lng]);
    }
  }

  function setDeliveryPoint(lat, lng) {
    setPoint({ lat, lng });
    setErrors((current) => ({ ...current, deliveryLat: undefined, deliveryLng: undefined }));
  }

  // pin moved on the map: write its address (and district) into the form
  function deliveryPlaceFound(place) {
    setAddressSource('map');
    setForm((current) => ({
      ...current,
      deliveryAddress: place.label,
      district: place.district || current.district,
    }));
    setErrors((current) => ({ ...current, deliveryAddress: undefined, district: undefined }));
  }

  // address typed: when typing stops for a moment, find it and move the pin there
  useEffect(() => {
    const text = form.deliveryAddress.trim();
    if (addressSource !== 'typed' || text.length < 5) {
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const found = await findAddress([text, form.district, 'Sri Lanka'].filter(Boolean).join(', '));
      if (cancelled || !found) return;
      setPoint({ lat: found.lat.toFixed(5), lng: found.lng.toFixed(5) });
      setDeliveryFocus([found.lat, found.lng]);
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.deliveryAddress, form.district, addressSource]);

  // farmerId: order only that farm's items; null: order the whole cart
  async function placeOrder(farmerId) {
    setServerError('');

    const found = validateCheckout(form);
    const pinned = point.lat !== '' && point.lng !== '';
    if (pinned && !(Number(point.lat) >= 5.9 && Number(point.lat) <= 9.9 && Number(point.lng) >= 79.5 && Number(point.lng) <= 81.9)) {
      found.deliveryLat = 'The delivery point must be in Sri Lanka';
    }
    setErrors(found);
    if (Object.keys(found).length > 0 || hasRowErrors) return;

    const items = farmerId === null ? cart.items : cart.items.filter((item) => item.farmerId === farmerId);
    const [deliveryLat, deliveryLng] = pinned
      ? [Number(point.lat), Number(point.lng)]
      : DISTRICT_CENTRES[form.district];
    const address = form.deliveryAddress.trim();
    const deliveryAddress = address.toLowerCase().includes(form.district.toLowerCase())
      ? address
      : `${address}, ${form.district}`;

    setSubmitting(true);
    setSubmittingFarm(farmerId);
    try {
      const { data: orders } = await api.post('/orders', {
        items: items.map((item) => ({ listingId: item.listingId, quantityKg: item.quantityKg })),
        deliveryAddress,
        deliveryLat,
        deliveryLng,
      });
      items.forEach((item) => cart.removeItem(item.listingId));
      window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
      const placed = orders.length === 1
        ? `Order #${orders[0].id} placed`
        : `${orders.length} orders placed, one for each farm`;
      if (items.length === cart.items.length) {
        showToast(`${placed}. Pay cash on delivery.`);
        navigate('/orders');
      } else {
        showToast(`${placed}. The other farms are still in your cart.`);
      }
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
      setSubmittingFarm(null);
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
                  {groups.length > 1 && (
                    <button type="button" className="btn btn-outline btn-small farm-order-button"
                      disabled={submitting || hasRowErrors} onClick={() => placeOrder(group.farmerId)}>
                      {submittingFarm === group.farmerId ? 'Placing…' : `Order from ${group.farmName} only`}
                    </button>
                  )}
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
                Each farm confirms and delivers its own order. Order all {groups.length} farms with
                {' '}<strong>Place all orders</strong>, or one farm at a time with its own button.
              </p>
            )}
          </div>

          <aside className="checkout-panel">
            <form className="form" onSubmit={(event) => { event.preventDefault(); placeOrder(null); }} noValidate>
              <h2>Delivery</h2>
              {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

              <FormField id="deliveryAddress" label="Delivery address" placeholder="No. 12, Galle Road, Colombo 03"
                value={form.deliveryAddress} onChange={handleChange} error={errors.deliveryAddress} />
              <FormField id="district" label="District" as="select" value={form.district} onChange={handleChange}
                error={errors.district}>
                <option value="">Choose a district</option>
                {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
              </FormField>

              <MapPicker
                id="delivery-point"
                label="Delivery point"
                lat={point.lat}
                lng={point.lng}
                onChange={setDeliveryPoint}
                onPlaceFound={deliveryPlaceFound}
                error={errors.deliveryLat || errors.deliveryLng}
                focus={deliveryFocus}
                fallbackCentre={DISTRICT_CENTRES[form.district]}
                hint="Type the address or choose the district and the pin moves there. Or tap the map, and the address is filled in for you."
              />

              <dl className="checkout-summary">
                <div><dt>Items</dt><dd>{cart.count}</dd></div>
                <div><dt>Weight</dt><dd>{formatKg(totalKg)}</dd></div>
                <div className="checkout-total"><dt>Total</dt><dd>{formatPrice(cart.totalAmount)}</dd></div>
              </dl>
              <p className="field-hint">Pay cash when the produce arrives. Prices and stock are checked again when you order.</p>

              <button type="submit" className="btn btn-primary btn-block" disabled={submitting || hasRowErrors}>
                {submitting && submittingFarm === null ? 'Placing order…' : groups.length > 1 ? 'Place all orders' : 'Place order'}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}