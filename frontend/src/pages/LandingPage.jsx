/**
 * Public home page: hero with search, live prices from Dambulla, features, roles and footer.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter } from 'react-icons/fa6';
import Logo from '../components/Logo';
import {
  ArrowRightIcon, ClockIcon, MarketIcon, ShieldCheckIcon, SproutIcon, TrendUpIcon, TruckIcon, UsersIcon,
} from '../components/Icons';
import useAuth from '../hooks/useAuth';
import api from '../api/client';
import { DISTRICTS } from '../constants/districts';
import './LandingPage.css';

const FEATURED_CROPS = ['Carrot', 'Beans', 'Tomato', 'Leeks'];

const FEATURES = [
  { icon: TrendUpIcon, title: 'Best-market advisor', text: 'Find where you\'ll earn the most' },
  { icon: ClockIcon, title: 'Freshness first', text: 'Sell before your harvest spoils' },
  { icon: TruckIcon, title: 'Shared, full lorries', text: 'Fewer trips, lower transport costs' },
];

const STEPS = [
  { title: 'List your harvest', text: 'Farmers add the crop, quantity, price and harvest date. Freshness is tracked automatically.' },
  { title: 'Buyers place orders', text: 'Buyers search by crop, district and freshness, then order and pay on delivery.' },
  { title: 'Planned delivery', text: 'Confirmed orders are grouped into full lorry trips along a short route.' },
];

const ROLES = [
  {
    label: 'Farmers', heading: 'Sell at the right market', role: 'FARMER', cta: 'Register',
    text: 'Sell where today\'s prices pay you the most.', 
    image: '/images/paddy-farmer.jpg', alt: 'A farmer standing in a green paddy field', position: 'center 30%',
  },
  {
    label: 'Buyers', heading: 'Buy straight from farms', role: 'BUYER', cta: 'Start buying',
    text: 'Order fresh produce and track every delivery.',
    image: '/images/market-stall-lk.jpg', alt: 'A colourful fruit and vegetable market stall', position: 'center 55%',
  },
  {
    label: 'Transporters', heading: 'Drive full, planned routes', role: 'TRANSPORTER', cta: 'Add your lorry',
    text: 'Get full loads and a clear route for every trip.',
    image: '/images/produce-truck.jpg', alt: 'A lorry loaded with crates of vegetables and fruit', position: 'center 60%',
  },
];

const SOCIAL_LINKS = [
  { label: 'Facebook', icon: FaFacebookF, href: 'https://www.facebook.com/' },
  { label: 'X (Twitter)', icon: FaXTwitter, href: 'https://x.com/' },
  { label: 'LinkedIn', icon: FaLinkedinIn, href: 'https://www.linkedin.com/' },
  { label: 'Instagram', icon: FaInstagram, href: 'https://www.instagram.com/' },
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
  const [centreCount, setCentreCount] = useState(null);
  const [prices, setPrices] = useState([]);
  const [priceStatus, setPriceStatus] = useState('loading');
  const [search, setSearch] = useState({ cropId: '', district: '', freshness: '' });

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [{ data: cropList }, { data: centres }] = await Promise.all([api.get('/crops'), api.get('/centres')]);
        const featured = cropList.filter((crop) => FEATURED_CROPS.includes(crop.name));

        // one request per featured crop, sent in parallel
        const rows = await Promise.all(
          featured.map(async (crop) => {
            const { data: centrePrices } = await api.get('/prices/latest', { params: { cropId: crop.id } });
            const dambulla = centrePrices.find((c) => c.centreName.startsWith('Dambulla')) ?? centrePrices[0];
            return dambulla ? { crop, price: dambulla } : null;
          }),
        );

        if (!cancelled) {
          setCrops(cropList);
          setCentreCount(centres.length);
          setPrices(rows.filter(Boolean));
          setPriceStatus('ready');
        }
      } catch {
        if (!cancelled) setPriceStatus('error');
      }
    }

    loadData();
    // ignore late responses if the user leaves the page first
    return () => {
      cancelled = true;
    };
  }, []);

  function updateSearch(event) {
    const { name, value } = event.target;
    setSearch((current) => ({ ...current, [name]: value }));
  }

  function handleSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    navigate(`/marketplace?${params.toString()}`);
  }

  const stats = [
    { icon: MarketIcon, value: centreCount ?? '–', label: 'Economic centres tracked' },
    { icon: SproutIcon, value: crops.length || '–', label: 'Crops with daily prices' },
    { icon: UsersIcon, value: 3, label: 'Roles on one platform' },
    { icon: ShieldCheckIcon, value: 'COD', label: 'Pay on delivery' },
  ];

  return (
    <div className="landing">
      <header className="hero">
        <img className="hero-photo" src="/images/hero-fields.jpg" alt="" />
        <div className="hero-shade" aria-hidden="true" />

        <nav className="landing-nav container" aria-label="Main">
          <Link to="/" aria-label="GoviRoute home"><Logo size={52} /></Link>
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
          <h1>Fresh harvests<br /><span className="hero-accent">smarter routes</span></h1>
          <p className="hero-lead">Sell at the best price and get your harvest to buyers while it&apos;s still fresh.</p>
          <div className="hero-actions">
            <Link to="/register?role=FARMER" className="btn btn-lime btn-lg">
              Start selling <ArrowRightIcon size={18} />
            </Link>
            <Link to="/marketplace" className="btn btn-outline-light btn-lg">Browse produce</Link>
          </div>
        </div>
      </header>

      <div className="container search-wrap">
        <form className="hero-search" onSubmit={handleSearch} aria-label="Find produce">
          <label className="hero-search-field">
            Crop
            <select name="cropId" value={search.cropId} onChange={updateSearch}>
              <option value="">All crops</option>
              {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
            </select>
          </label>
          <label className="hero-search-field">
            District
            <select name="district" value={search.district} onChange={updateSearch}>
              <option value="">Any district</option>
              {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
            </select>
          </label>
          <label className="hero-search-field">
            Freshness
            <select name="freshness" value={search.freshness} onChange={updateSearch}>
              <option value="">Any</option>
              <option value="FRESH">Fresh</option>
              <option value="SELL_SOON">Sell soon</option>
              <option value="URGENT">Urgent deals</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary">Find produce</button>
        </form>
      </div>

      <section id="prices" className="section container" aria-labelledby="prices-title">
        <div className="section-head">
          <div className="section-title">
            <p className="eyebrow">Today at Dambulla</p>
            <h2 id="prices-title">Fresh produce and today&apos;s prices</h2>
          </div>
          <Link to="/marketplace" className="arrow-link">View marketplace <ArrowRightIcon size={16} /></Link>
        </div>

        {priceStatus === 'loading' && <p className="text-muted">Loading today&apos;s prices…</p>}
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
                  <Link to={`/marketplace?cropId=${crop.id}`} className="arrow-link small">
                    See listings <ArrowRightIcon size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="why" className="why container" aria-labelledby="why-title">
        <div className="why-text">
          <p className="eyebrow">Why GoviRoute</p>
          <h2 id="why-title">Less waste between the field and the market</h2>
          <p className="text-muted">Better prices for farmers, fresher food for buyers and fuller lorries on every trip.</p>
          <ul className="why-list">
            {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
              <li key={title}>
                <span className="why-icon"><FeatureIcon /></span>
                <span className="why-item-text">
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="why-collage">
          <span className="dot-grid" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
          </span>
          <img className="circle circle-main" src="/images/farmer-lk.jpg" alt="A Sri Lankan farmer standing in his paddy field" />
          <img className="circle circle-veg" src="/images/veg-basket.jpg" alt="A basket of fresh vegetables" />
          <img className="circle circle-truck" src="/images/banana-truck.jpg" alt="A lorry carrying a load of fresh produce" />
        </div>
      </section>

      <section className="container" aria-label="GoviRoute in numbers">
        <div className="stats-band">
          {stats.map(({ icon: StatIcon, value, label }) => (
            <div key={label} className="stat">
              <span className="stat-icon"><StatIcon size={36} strokeWidth={1.6} /></span>
              <span className="stat-text">
                <span className="stat-value">{value}</span>
                <span className="stat-label">{label}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="section container" aria-labelledby="how-title">
        <div className="section-title">
          <p className="eyebrow">How it works</p>
          <h2 id="how-title">From the field to the buyer in three steps</h2>
        </div>
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="step-card">
              <span className="step-number" aria-hidden="true">{index + 1}</span>
              <h3>{step.title}</h3>
              <p className="text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="roles" className="section container" aria-labelledby="roles-title">        <div className="section-title">
          <p className="eyebrow">One platform, three roles</p>
          <h2 id="roles-title">Built for everyone in the chain</h2>
        </div>
        <div className="role-grid">
          {ROLES.map((role) => (
            <article key={role.label} className="role-card">
              <div className="role-photo">
                <img src={role.image} alt={role.alt} style={{ objectPosition: role.position }} />
                <span className="role-tag">{role.label}</span>
              </div>
              <div className="role-card-body">
                <h3>{role.heading}</h3>
                <p className="text-muted">{role.text}</p>
                <Link to={`/register?role=${role.role}`} className="arrow-link">
                  {role.cta} <ArrowRightIcon size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="container cta-wrap" aria-labelledby="cta-title">
        <div className="cta">
          <img src="/images/paddy-farmer.jpg" alt="" />
          <div className="cta-shade" aria-hidden="true" />
          <div className="cta-content">
            <p className="eyebrow cta-eyebrow">Free to join</p>
            <h2 id="cta-title">Ready to grow your sales?</h2>
            <p>Create your free account and list your first harvest today.</p>
            <Link to="/register" className="btn btn-lime btn-lg">Get started <ArrowRightIcon size={18} /></Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Logo size={40} />
            <p>Fresh produce, fair prices, smarter delivery.</p>
            <ul className="social-links">
              {SOCIAL_LINKS.map(({ label, icon: SocialIcon, href }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noreferrer" aria-label={`GoviRoute on ${label}`}>
                    <SocialIcon aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav className="footer-col" aria-label="Platform">
            <strong>Platform</strong>
            <Link to="/marketplace">Marketplace</Link>
            <a href="#prices">Market prices</a>
            <a href="#how">How it works</a>
          </nav>

          <nav className="footer-col" aria-label="Join as">
            <strong>Join as</strong>
            <Link to="/register?role=FARMER">Farmer</Link>
            <Link to="/register?role=BUYER">Buyer</Link>
            <Link to="/register?role=TRANSPORTER">Transporter</Link>
          </nav>

          <div className="footer-col">
            <strong>Contact</strong>
            <span>Faculty of Engineering</span>
            <span>University of Ruhuna, Sri Lanka</span>
          </div>
        </div>
        <p className="footer-copy container">© 2026 GoviRoute. All rights reserved.</p>
      </footer>
    </div>
  );
}