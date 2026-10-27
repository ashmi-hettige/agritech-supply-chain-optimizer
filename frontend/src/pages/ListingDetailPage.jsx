/**
 * Full details of one listing. Ordering from this page is added with the cart.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import BackButton from '../components/BackButton';
import FreshnessBadge from '../components/FreshnessBadge';
import { formatDate, formatKg, formatPrice } from '../utils/format';
import './Marketplace.css';

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
          </div>
        </article>
      )}
    </div>
  );
}