/**
 * Best-market advisor: which economic centre pays the most for this harvest after transport?
 * The farmer picks one of their listings (its kilos and pickup point are used) or any crop and amount.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import FormField from '../components/FormField';
import { formatKg, formatPrice, shortCentreName } from '../utils/format';
import './Insights.css';

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function AdvisorResult({ advice }) {
  const best = advice.options[0];
  const topNet = Math.max(...advice.options.map((option) => Number(option.netValue)));

  return (
    <div className="advisor-result">
      <section className="best-market" aria-labelledby="best-title">
        <p className="tip-eyebrow">Best market for {formatKg(advice.quantityKg)} {advice.cropName.toLowerCase()}</p>
        <h2 id="best-title">Sell at {shortCentreName(best.centreName)}</h2>
        <p className="best-net">
          You take home <strong>{formatPrice(Math.round(best.netValue))}</strong>
          {' '}after {formatPrice(Math.round(best.transportCost))} transport ({best.distanceKm} km by road)
        </p>
        {Number(advice.extraVsNearest) > 0 ? (
          <p className="best-extra">
            {formatPrice(Math.round(advice.extraVsNearest))} more than the nearest centre, {shortCentreName(advice.nearestCentreName)}
          </p>
        ) : (
          <p className="best-extra">The nearest centre is also the best one today.</p>
        )}
      </section>

      <section className="panel" aria-labelledby="compare-title">
        <div className="panel-head">
          <h2 id="compare-title">All centres, best first</h2>
        </div>
        <ol className="market-bars">
          {advice.options.map((option, index) => {
            const width = Math.max(4, (Number(option.netValue) / topNet) * 100);
            return (
              <li key={option.centreId} className={index === 0 ? 'best' : ''}>
                <div className="market-bar-head">
                  <strong>{shortCentreName(option.centreName)}</strong>
                  <span>{formatPrice(Math.round(option.netValue))}</span>
                </div>
                <div className="market-bar-track" aria-hidden="true">
                  <div className="market-bar-fill" style={{ width: `${width}%` }} />
                </div>
                <p className="market-bar-note">
                  {formatPrice(option.pricePerKg)}/kg · {option.distanceKm} km · transport {formatPrice(Math.round(option.transportCost))}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="field-hint">
          Transport = {formatPrice(advice.fixedCost)} + {formatPrice(advice.ratePerKgKm)} per kg per km.
          Road distance is the straight-line distance × {advice.roadFactor}. Prices are today&apos;s averages.
        </p>
      </section>
    </div>
  );
}

export default function AdvisorPage() {
  const [searchParams] = useSearchParams();
  const [crops, setCrops] = useState([]);
  const [listings, setListings] = useState([]);
  const [mode, setMode] = useState('listing');
  const [form, setForm] = useState({ listingId: '', cropId: '', quantityKg: '' });
  const [errors, setErrors] = useState({});
  const [advice, setAdvice] = useState(null);
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  async function fetchAdvice(params) {
    setBusy(true);
    setServerError('');
    try {
      const { data } = await api.get('/advisor', { params });
      setAdvice(data);
    } catch (error) {
      setAdvice(null);
      setErrors(getFieldErrors(error));
      setServerError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function paramsForListing(listing) {
    return { cropId: listing.cropId, quantityKg: listing.availableKg, lat: listing.pickupLat, lng: listing.pickupLng };
  }

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/listings/mine')])
      .then(([cropResponse, listingResponse]) => {
        setCrops(cropResponse.data);
        const active = listingResponse.data.filter((item) => item.status === 'AVAILABLE');
        setListings(active);

        // opened from the dashboard tip (?listingId=5): answer straight away
        const wanted = active.find((item) => String(item.id) === searchParams.get('listingId')) ?? active[0];
        if (wanted) {
          setForm((current) => ({ ...current, listingId: String(wanted.id) }));
          fetchAdvice(paramsForListing(wanted));
        } else {
          setMode('crop');
        }
      })
      .catch((error) => setServerError(getErrorMessage(error)));
    // runs once when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (mode === 'listing') {
      const listing = listings.find((item) => String(item.id) === form.listingId);
      if (!listing) {
        setErrors({ listingId: 'Choose a listing' });
        return;
      }
      fetchAdvice(paramsForListing(listing));
      return;
    }

    const found = {};
    if (!form.cropId) found.cropId = 'Choose a crop';
    if (!MONEY_PATTERN.test(form.quantityKg.trim())) found.quantityKg = 'Enter kilos, e.g. 500';
    else if (Number(form.quantityKg) < 1 || Number(form.quantityKg) > 100000) found.quantityKg = 'Between 1 and 100,000 kg';
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    // no lat/lng: the server uses the farm location from the farmer's profile
    fetchAdvice({ cropId: form.cropId, quantityKg: form.quantityKg.trim() });
  }

  return (
    <section aria-labelledby="advisor-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Farmer</p>
          <h1 id="advisor-title">Best-market advisor</h1>
          <p className="text-muted page-intro">Today&apos;s price at each centre, minus what it costs to get your harvest there.</p>
        </div>
      </div>

      <div className="advisor-layout">
        <form className="card form advisor-form" onSubmit={handleSubmit} noValidate>
          <div className="mode-switch" role="group" aria-label="What are you selling?">
            <button type="button" className={`tab-chip ${mode === 'listing' ? 'on' : ''}`} aria-pressed={mode === 'listing'}
              onClick={() => setMode('listing')} disabled={listings.length === 0}>
              One of my listings
            </button>
            <button type="button" className={`tab-chip ${mode === 'crop' ? 'on' : ''}`} aria-pressed={mode === 'crop'}
              onClick={() => setMode('crop')}>
              Any crop
            </button>
          </div>

          {mode === 'listing' && (
            <FormField id="listingId" label="Listing" as="select" value={form.listingId} onChange={handleChange}
              error={errors.listingId} hint="Uses the kilos left and the pickup point of this listing.">
              <option value="">Choose a listing</option>
              {listings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.cropName} · {formatKg(item.availableKg)} · {item.district}
                </option>
              ))}
            </FormField>
          )}

          {mode === 'crop' && (
            <>
              <FormField id="cropId" label="Crop" as="select" value={form.cropId} onChange={handleChange} error={errors.cropId}>
                <option value="">Choose a crop</option>
                {crops.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </FormField>
              <FormField id="quantityKg" label="Quantity (kg)" inputMode="decimal" placeholder="500"
                value={form.quantityKg} onChange={handleChange} error={errors.quantityKg}
                hint="Starts from your farm location." />
            </>
          )}

          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Working it out…' : 'Find the best market'}
          </button>
        </form>

        {advice && <AdvisorResult advice={advice} />}
        {!advice && !busy && !serverError && (
          <div className="empty-state"><p className="text-muted">Choose what you are selling to compare the centres.</p></div>
        )}
      </div>
    </section>
  );
}
