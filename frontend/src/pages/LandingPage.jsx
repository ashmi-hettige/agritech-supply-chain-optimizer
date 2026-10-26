/**
 * Public home page: hero search, live prices from Dambulla, features and roles.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import useAuth from '../hooks/useAuth';
import api from '../api/client';
import { DISTRICTS } from '../constants/districts';
import './LandingPage.css';

const FEATURED_CROPS = ['Carrot', 'Beans', 'Tomato', 'Leeks'];

const FEATURES = [
  { title: 'Best-market advisor', text: 'Compare economic centres after transport cost and sell where you earn the most.' },
  { title: 'Freshness first', text: 'Every listing shows how much shelf life is left, so produce sells before it spoils.' },
  { title: 'Shared, full lorries', text: 'Orders are grouped into planned trips that fill each vehicle and shorten the route.' },
];

const ROLES = [
  { title: 'Farmers', heading: 'Sell at the right market', text: 'Check today\'s prices and list your harvest in minutes.', image: '/images/paddy-farmer.jpg', cta: 'Start selling' },
  { title: 'Buyers', heading: 'Buy straight from farms', text: 'Order fresh produce by crop, district and freshness.', image: '/images/market-stall-lk.jpg', cta: 'Start buying' },
  { title: 'Transporters', heading: 'Drive full, planned routes', text: 'Register your lorry and follow a clear route for every trip.', image: '/images/produce-truck.jpg', cta: 'Add your lorry' },
];

// percentage change of today's price against the 7-day average
function priceChange(latest, average) {
  const change = ((Number(latest) - Number(average)) / Number(average)) * 100;
  return Math.round(change);
}

function PriceTrend({ change }) {
  if (change > 0) return <span className="trend trend-up">▲ {change}%<span className="sr-only"> above the 7-day average</span></span>;
  if (change < 0) return <span className="trend trend-down">▼ {Math.abs(change)}%<span className="sr-only"> below the 7-day average</span></span>;
  return <span className="trend">0%<span className="sr-only"> change</span></span>;
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [prices, setPrices] = useState([]);
  const [priceStatus, setPriceStatus] = useState('loading');
  const [search, setSearch] = useState({ cropId: '', district: '' });

  useEffect(() => {
    let cancelled = false;

    async function loadPrices() {
      try {
        const { data: cropList } = await api.get('/crops');
        const featured = cropList.filter((crop) => FEATURED_CROPS.includes(crop.name));

        // one request per featured crop, sent in parallel
        const rows = await Promise.all(
          featured.map(async (crop) => {
            const { data: centres } = await api.get('/prices/latest', { params: { cropId: crop.id } });
            const dambulla = centres.find((centre) => centre.centreName.startsWith('Dambulla')) ?? centres[0];
            return dambulla ? { crop, price: dambulla } : null;
          }),
        );

        if (!cancelled) {
          setCrops(cropList);
          setPrices(rows.filter(Boolean));
          setPriceStatus('ready');
        }
      } catch {
        if (!cancelled) setPriceStatus('error');
      }
    }

    loadPrices();
    // ignore late responses if the user leaves the page first
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.cropId) params.set('cropId', search.cropId);
    if (search.district) params.set('district', search.district);
    navigate(`/marketplace?${params.toString()}`);
  }

  return (
    <div className="landing">
      <header className="hero">
        <img className="hero-photo" src="/images/hero-fields.jpg" alt="" />
        <div className="hero-shade" aria-hidden="true" />

        <nav className="landing-nav container" aria-label="Main">
          <Link to="/" aria-label="GoviRoute home"><Logo size={44} /></Link>
          <div className="landing-nav-links">
            <a href="#prices">Market prices</a>
            <a href="#how">How it works</a>
            {user ? (
              <Link to="/dashboard" className="btn btn-lime">Go to dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost-light">Log in</Link>
                <Link to="/register" className="btn btn-lime">Join free</Link>
              </>
            )}
          </div>
        </nav>

        <div className="hero-content container">
          <span className="hero-pill"><span className="dot" aria-hidden="true" />For Sri Lankan farmers, buyers and transporters</span>
          <h1>Fresh harvests,<br /><span className="hero-accent">smarter routes</span></h1>
          <p className="hero-lead">Sell at the best price and get your harvest to buyers while it is still fresh.</p>

          <form className="hero-search" onSubmit={handleSearch} aria-label="Find produce">
            <label className="hero-search-field">
              <span>Crop</span>
              <select value={search.cropId} onChange={(e) => setSearch({ ...search, cropId: e.target.value })}>
                <option value="">All crops</option>
                {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
              </select>
            </label>
            <label className="hero-search-field">
              <span>District</span>
              <select value={search.district} onChange={(e) => setSearch({ ...search, district: e.target.value })}>
                <option value="">Any district</option>
                {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
              </select>
            </label>
            <button type="submit" className="btn btn-primary">Find produce</button>
          </form>
        </div>
      </header>

      <section id="prices" className="section container" aria-labelledby="prices-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Today at Dambulla</p>
            <h2 id="prices-title">Fresh produce and today's prices</h2>
          </div>
        </div>

        {priceStatus === 'loading' && <p className="text-muted">Loading today's prices…</p>}
        {priceStatus === 'error' && <p className="text-muted">Prices are not available right now. Please try again later.</p>}
        {priceStatus === 'ready' && (
          <div className="price-grid">
            {prices.map(({ crop, price }) => (
              <article key={crop.id} className="price-card">
                <img src={crop.imageUrl} alt={crop.name} />
                <div className="price-card-body">
                  <div className="price-card-top">
                    <h3>{crop.name}</h3>
                    <PriceTrend change={priceChange(price.latestAvgPrice, price.sevenDayAvgPrice)} />
                  </div>
                  <p className="price-value">LKR {Math.round(Number(price.latestAvgPrice))}<span>/kg</span></p>
                  <Link to={`/marketplace?cropId=${crop.id}`}>See listings</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="how" className="section section-mist" aria-labelledby="how-title">
        <div className="container">
          <p className="eyebrow">Why GoviRoute</p>
          <h2 id="how-title">Less waste between the field and the market</h2>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="card feature-card">
                <h3>{feature.title}</h3>
                <p className="text-muted">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="roles-title">
        <p className="eyebrow">One platform, three roles</p>
        <h2 id="roles-title">Built for everyone in the chain</h2>
        <div className="role-grid">
          {ROLES.map((role) => (
            <article key={role.title} className="role-card">
              <img src={role.image} alt="" />
              <div className="role-card-body">
                <p className="eyebrow">{role.title}</p>
                <h3>{role.heading}</h3>
                <p className="text-muted">{role.text}</p>
                <Link to="/register">{role.cta} →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cta" aria-labelledby="cta-title">
        <img src="/images/field-rows.jpg" alt="" />
        <div className="cta-content container">
          <p className="eyebrow cta-eyebrow">Free to join</p>
          <h2 id="cta-title">Ready to grow your sales?</h2>
          <p>Create your free account and list your first harvest today.</p>
          <Link to="/register" className="btn btn-lime">Get started</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container footer-inner">
          <Logo size={32} />
          <p>Fresh produce, fair prices, smarter delivery.</p>
          <p className="footer-copy">© 2026 GoviRoute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}