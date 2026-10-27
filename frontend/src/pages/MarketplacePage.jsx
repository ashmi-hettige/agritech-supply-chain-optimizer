/**
 * Buyer marketplace: filters on the left, listing cards on the right, sort and pagination.
 * All filters live in the URL (?cropId=1&district=Matale…), so results can be bookmarked and shared.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import FreshnessBadge from '../components/FreshnessBadge';
import Pagination from '../components/Pagination';
import { DISTRICTS } from '../constants/districts';
import { formatKg, formatPrice } from '../utils/format';
import './Marketplace.css';

const PAGE_SIZE = 12;

const FRESHNESS_OPTIONS = [
  { value: 'FRESH', label: 'Fresh' },
  { value: 'SELL_SOON', label: 'Sell soon' },
  { value: 'URGENT', label: 'Urgent deals' },
];

const SORT_OPTIONS = [
  { value: 'expiring_soon', label: 'Sell soon first' },
  { value: 'price_asc', label: 'Lowest price' },
  { value: 'price_desc', label: 'Highest price' },
  { value: 'harvest_newest', label: 'Recently harvested' },
  { value: 'newest', label: 'Newest listings' },
];

const FILTER_KEYS = ['q', 'cropId', 'freshness', 'district', 'farmerId', 'minPrice', 'maxPrice'];

function readFilters(params) {
  return {
    cropIds: params.getAll('cropId'),
    freshness: params.getAll('freshness'),
    district: params.get('district') ?? '',
    farmerId: params.get('farmerId') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    sort: params.get('sort') ?? 'expiring_soon',
    page: Number(params.get('page') ?? 0),
  };
}

export default function MarketplacePage() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);

  const [crops, setCrops] = useState([]);
  const [farms, setFarms] = useState([]);
  const [result, setResult] = useState({ key: null, data: null, error: '' });

  // the query sent to the API; when it changes, new results are loaded
  const apiQuery = new URLSearchParams(params);
  apiQuery.set('size', PAGE_SIZE);
  if (!apiQuery.has('sort')) apiQuery.set('sort', 'expiring_soon');
  const queryKey = apiQuery.toString();
  const loading = result.key !== queryKey;

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/farms')])
      .then(([cropResponse, farmResponse]) => {
        setCrops(cropResponse.data);
        setFarms(farmResponse.data);
      })
      .catch(() => {
        // the filters still work without these lists; the results show the real error
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/listings?${queryKey}`)
      .then((response) => {
        if (!cancelled) setResult({ key: queryKey, data: response.data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key: queryKey, data: null, error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey]);

  // change some URL parameters; any filter change goes back to page 1
  function updateParams(changes) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      next.delete(key);
      if (Array.isArray(value)) value.forEach((item) => next.append(key, item));
      else if (value !== '' && value !== null && value !== undefined) next.set(key, value);
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  }

  function toggleValue(key, list, value) {
    const nextList = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
    updateParams({ [key]: nextList });
  }

  function updatePrice(event) {
    const { name, value } = event.target;
    const clean = value.trim();
    if (clean === '' || /^\d+(\.\d{1,2})?$/.test(clean)) {
      updateParams({ [name]: clean });
    }
  }

  function clearAll() {
    const next = new URLSearchParams(params);
    FILTER_KEYS.forEach((key) => next.delete(key));
    next.delete('page');
    setParams(next);
  }

  function changePage(page) {
    updateParams({ page: page === 0 ? '' : page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const page = result.data;
  const firstShown = page && page.totalElements > 0 ? page.page * page.size + 1 : 0;
  const lastShown = page ? page.page * page.size + page.content.length : 0;
  const searchText = params.get('q');

  return (
    <div className="market-page">
      <section className="market-banner">
        <img src="/images/field-rows.jpg" alt="" />
        <div className="market-banner-shade" aria-hidden="true" />
        <div className="market-banner-content">
          <h1>Fresh from the farm</h1>
          <div className="banner-chips">
            <span>Cash on delivery</span>
            <span>Straight from farmers</span>
            <span className="chip-lime">Freshness checked daily</span>
          </div>
        </div>
      </section>

      <div className="market-body">
        <aside className="filters" aria-label="Filters">
          <div className="filters-head">
            <h2>Filters</h2>
            <button type="button" className="link-button" onClick={clearAll}>Clear all</button>
          </div>

          <fieldset className="filter-group">
            <legend>Freshness</legend>
            <div className="chip-row">
              {FRESHNESS_OPTIONS.map((option) => {
                const pressed = filters.freshness.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-chip ${pressed ? 'on' : ''}`}
                    aria-pressed={pressed}
                    onClick={() => toggleValue('freshness', filters.freshness, option.value)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend>Crop</legend>
            <div className="crop-list">
              {crops.map((crop) => (
                <label key={crop.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={filters.cropIds.includes(String(crop.id))}
                    onChange={() => toggleValue('cropId', filters.cropIds, String(crop.id))}
                  />
                  {crop.name}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="filter-group filter-select">
            <span className="filter-label">District</span>
            <select value={filters.district} onChange={(e) => updateParams({ district: e.target.value })}>
              <option value="">All districts</option>
              {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>

          <label className="filter-group filter-select">
            <span className="filter-label">Farm</span>
            <select value={filters.farmerId} onChange={(e) => updateParams({ farmerId: e.target.value })}>
              <option value="">All farms</option>
              {farms.map((farm) => (
                <option key={farm.farmerId} value={farm.farmerId}>
                  {farm.farmName}{farm.district ? `, ${farm.district}` : ''}
                </option>
              ))}
            </select>
          </label>

          {/* key resets the inputs when "Clear all" empties the URL */}
          <div className="filter-group" key={`${filters.minPrice}-${filters.maxPrice}`}>
            <span className="filter-label">Price (LKR/kg)</span>
            <div className="price-row">
              <label>
                Min
                <input name="minPrice" inputMode="decimal" defaultValue={filters.minPrice}
                  onBlur={updatePrice} onKeyDown={(e) => e.key === 'Enter' && updatePrice(e)} />
              </label>
              <label>
                Max
                <input name="maxPrice" inputMode="decimal" defaultValue={filters.maxPrice}
                  onBlur={updatePrice} onKeyDown={(e) => e.key === 'Enter' && updatePrice(e)} />
              </label>
            </div>
          </div>
        </aside>

        <main className="results" aria-busy={loading}>
          <div className="results-bar">
            <p className="text-muted" aria-live="polite">
              {page && page.totalElements > 0 && (
                <>Showing <strong>{firstShown}–{lastShown}</strong> of {page.totalElements}</>
              )}
              {searchText && <> for &ldquo;{searchText}&rdquo;</>}
            </p>
            <label className="sort-select">
              Sort by
              <select value={filters.sort} onChange={(e) => updateParams({ sort: e.target.value })}>
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          {loading && !page && <p className="text-muted">Loading fresh produce…</p>}
          {result.error && !loading && <div className="alert alert-error" role="alert">{result.error}</div>}

          {page && page.content.length === 0 && !loading && (
            <div className="empty-state">
              <h2>No produce matches these filters</h2>
              <p className="text-muted">Try another crop or district, or clear the filters.</p>
              <button type="button" className="btn btn-outline" onClick={clearAll}>Clear all filters</button>
            </div>
          )}

          {page && page.content.length > 0 && (
            <div className={`listing-grid ${loading ? 'is-loading' : ''}`}>
              {page.content.map((listing) => (
                <article key={listing.id} className="listing-card">
                  <div className="listing-photo">
                    <img src={listing.cropImageUrl} alt={listing.cropName} />
                    <FreshnessBadge label={listing.freshnessLabel} daysLeft={listing.daysLeft} className="photo-badge" />
                  </div>
                  <div className="listing-body">
                    <div className="listing-title">
                      <h3>{listing.cropName}</h3>
                      <span>Grade {listing.grade}</span>
                    </div>
                    <p className="listing-farm">{listing.farmName ?? listing.farmerName} · {listing.district}</p>
                    <div className="listing-price">
                      <span className="price">{formatPrice(listing.pricePerKg)}<small>/kg</small></span>
                      <span className="text-muted">{formatKg(listing.availableKg)} left</span>
                    </div>
                    <Link to={`/listings/${listing.id}`} className="btn btn-primary btn-block">View details</Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {page && <Pagination page={page.page} totalPages={page.totalPages} onChange={changePage} />}
        </main>
      </div>
    </div>
  );
}