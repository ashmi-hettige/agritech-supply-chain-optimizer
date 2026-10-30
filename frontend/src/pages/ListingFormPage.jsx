/**
 * Add-listing and edit-listing form, with a live preview of the marketplace card.
 * /farmer/listings/new creates; /farmer/listings/:id/edit updates.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import BackButton from '../components/BackButton';
import FormField from '../components/FormField';
import FreshnessBadge from '../components/FreshnessBadge';
import MapPicker from '../components/MapPicker';
import NewCropForm from '../components/NewCropForm';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { DISTRICTS, DISTRICT_CENTRES } from '../constants/districts';
import { formatDate, formatKg, formatPrice, todayIso } from '../utils/format';
import { validateListing } from '../utils/validation';
import './Farmer.css';

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(isoDate, days) {
  const date = toDate(isoDate);
  date.setDate(date.getDate() + days);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

// preview only: the same rule as FreshnessScorer.java; the server still decides the real badge
function previewFreshness(expiryIso, shelfLifeDays, todayString) {
  const daysLeft = Math.round((toDate(expiryIso) - toDate(todayString)) / DAY_MS);
  const score = Math.min(1, Math.max(0, daysLeft) / shelfLifeDays);
  let label = 'URGENT';
  if (score > 0.5) label = 'FRESH';
  else if (score > 0.2) label = 'SELL_SOON';
  return { daysLeft, label };
}

function ListingPreview({ crop, form, today }) {
  if (!crop) {
    return (
      <aside className="listing-preview card" aria-label="Preview">
        <p className="eyebrow">Preview</p>
        <p className="text-muted">Choose a crop to see how buyers will see your listing.</p>
      </aside>
    );
  }

  const expiry = form.harvestDate ? addDays(form.harvestDate, crop.shelfLifeDays) : null;
  const freshness = expiry ? previewFreshness(expiry, crop.shelfLifeDays, today) : null;

  return (
    <aside className="listing-preview" aria-label="Preview">
      <p className="eyebrow">What buyers will see</p>
      <article className="preview-card">
        <div className="preview-photo">
          <img src={crop.imageUrl} alt="" />
          {freshness && freshness.daysLeft >= 0 && (
            <FreshnessBadge label={freshness.label} daysLeft={freshness.daysLeft} className="photo-badge" />
          )}
        </div>
        <div className="preview-body">
          <div className="preview-title">
            <h3>{crop.name}</h3>
            <span>Grade {form.grade}</span>
          </div>
          <p className="text-muted">{form.district || 'District'}</p>
          <div className="preview-price">
            <span className="price">{form.pricePerKg ? formatPrice(form.pricePerKg) : 'LKR –'}<small>/kg</small></span>
            <span className="text-muted">{form.quantityKg ? formatKg(form.quantityKg) : '– kg'}</span>
          </div>
        </div>
      </article>
      {expiry && (
        <p className="expiry-note">
          {crop.name} keeps for about {crop.shelfLifeDays} days, so this listing stays on sale until{' '}
          <strong>{formatDate(expiry)}</strong>.
        </p>
      )}
    </aside>
  );
}

function ListingForm({ crops, initial, listingId }) {
  const showToast = useToast();
  const navigate = useNavigate();
  const isEdit = Boolean(listingId);

  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [cropList, setCropList] = useState(crops);
  const [addingCrop, setAddingCrop] = useState(false);

  const crop = cropList.find((item) => String(item.id) === String(form.cropId));
  // where the map should fly to: the district's centre when the district changes
  const [pickupFocus, setPickupFocus] = useState(null);
  const today = todayIso();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));

    // a new district moves the pickup pin to that district's centre
    if (name === 'district' && DISTRICT_CENTRES[value]) {
      const [lat, lng] = DISTRICT_CENTRES[value];
      setPickupPoint(lat.toFixed(5), lng.toFixed(5));
      setPickupFocus([lat, lng]);
    }
  }

  // the pin's address names a district: fill in the District box to match
  function pickupPlaceFound(place) {
    if (place.district) setForm((current) => ({ ...current, district: place.district }));
  }

  function setPickupPoint(pickupLat, pickupLng) {
    setForm((current) => ({ ...current, pickupLat, pickupLng }));
    setErrors((current) => ({ ...current, pickupLat: undefined, pickupLng: undefined }));
  }

  function cropAdded(newCrop) {
    setCropList((current) => [...current, newCrop].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((current) => ({ ...current, cropId: String(newCrop.id) }));
    setErrors((current) => ({ ...current, cropId: undefined }));
    setAddingCrop(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');

    const found = validateListing(form, today);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      cropId: Number(form.cropId),
      quantityKg: Number(form.quantityKg),
      pricePerKg: Number(form.pricePerKg),
      harvestDate: form.harvestDate,
      grade: form.grade,
      district: form.district,
      pickupLat: Number(form.pickupLat),
      pickupLng: Number(form.pickupLng),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.put(`/listings/${listingId}`, body);
        showToast('Listing updated');
      } else {
        await api.post('/listings', body);
        showToast(`${crop.name} is now listed in the marketplace`);
      }
      navigate('/farmer/listings');
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="listing-editor">
      <form className="form listing-form card" onSubmit={handleSubmit} noValidate>
        {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}

        <div className="form-row">
          <div className="crop-field">
            <FormField id="cropId" label="Crop" as="select" value={form.cropId} onChange={handleChange}
              error={errors.cropId} disabled={isEdit}
              hint={isEdit ? 'The crop cannot be changed. Create a new listing for a different crop.' : undefined}>
              <option value="">Choose a crop</option>
              {cropList.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FormField>
            {!isEdit && !addingCrop && (
              <button type="button" className="link-button add-crop-link" onClick={() => setAddingCrop(true)}>
                Crop not in the list? Add it
              </button>
            )}
          </div>
          <FormField id="grade" label="Grade" as="select" value={form.grade} onChange={handleChange} error={errors.grade}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </FormField>
        </div>

        {addingCrop && <NewCropForm onAdded={cropAdded} onCancel={() => setAddingCrop(false)} />}

        <div className="form-row">
          <FormField id="quantityKg" label="Quantity (kg)" inputMode="decimal" placeholder="500"
            value={form.quantityKg} onChange={handleChange} error={errors.quantityKg} />
          <FormField id="pricePerKg" label="Price (LKR per kg)" inputMode="decimal" placeholder="210"
            value={form.pricePerKg} onChange={handleChange} error={errors.pricePerKg} />
        </div>

        <div className="form-row">
          <FormField id="harvestDate" label="Harvest date" type="date" max={today}
            value={form.harvestDate} onChange={handleChange} error={errors.harvestDate} />
          <FormField id="district" label="District" as="select" value={form.district} onChange={handleChange} error={errors.district}>
            <option value="">Choose a district</option>
            {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
          </FormField>
        </div>

        <MapPicker
          id="pickup-location"
          label="Pickup location"
          lat={form.pickupLat}
          lng={form.pickupLng}
          onChange={setPickupPoint}
          error={errors.pickupLat || errors.pickupLng}
          onPlaceFound={pickupPlaceFound}
          focus={pickupFocus}
          fallbackCentre={DISTRICT_CENTRES[form.district]}
          hint="Tap where the lorry should collect the produce."
        />

        <div className="form-actions">
          <Link to="/farmer/listings" className="btn btn-outline">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add listing'}
          </button>
        </div>
      </form>

      <ListingPreview crop={crop} form={form} today={today} />
    </div>
  );
}

export default function ListingFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState({ key: null, crops: [], initial: null, error: '' });
  const key = id ?? 'new';

  useEffect(() => {
    let cancelled = false;
    const requests = [api.get('/crops')];
    if (id) requests.push(api.get(`/listings/${id}`));

    Promise.all(requests)
      .then(([cropResponse, listingResponse]) => {
        const listing = listingResponse?.data;
        const initial = listing
          ? {
              cropId: String(listing.cropId),
              grade: listing.grade,
              quantityKg: String(listing.quantityKg),
              pricePerKg: String(listing.pricePerKg),
              harvestDate: listing.harvestDate,
              district: listing.district,
              pickupLat: String(listing.pickupLat),
              pickupLng: String(listing.pickupLng),
            }
          : {
              cropId: '', grade: 'A', quantityKg: '', pricePerKg: '',
              harvestDate: todayIso(), district: user.district ?? '', pickupLat: '', pickupLng: '',
            };
        if (!cancelled) setData({ key, crops: cropResponse.data, initial, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setData({ key, crops: [], initial: null, error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, key, user.district]);

  const loading = data.key !== key;

  return (
    <section aria-labelledby="listing-form-title">
      <div className="page-title-row">
        <BackButton to="/farmer/listings" label="Back to My listings" />
        <h1 id="listing-form-title">{id ? 'Edit listing' : 'Add a listing'}</h1>
      </div>

      {loading && <p className="text-muted">Loading…</p>}
      {!loading && data.error && <div className="alert alert-error" role="alert">{data.error}</div>}
      {!loading && data.initial && (
        <ListingForm key={key} crops={data.crops} initial={data.initial} listingId={id} />
      )}
    </section>
  );
}