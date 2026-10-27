/**
 * Layout for the public marketplace pages: top bar with logo, search box and account links.
 * @author Ashmi Hettige
 */
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import useAuth from '../hooks/useAuth';
import './MarketLayout.css';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export default function MarketLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const onMarketplace = location.pathname === '/marketplace';
  const currentQuery = onMarketplace ? searchParams.get('q') ?? '' : '';

  function handleSearch(event) {
    event.preventDefault();
    const text = new FormData(event.currentTarget).get('q').trim();
    // keep the buyer's other filters when searching from the marketplace page
    const params = new URLSearchParams(onMarketplace ? searchParams : undefined);
    params.delete('page');
    if (text) params.set('q', text);
    else params.delete('q');
    navigate(`/marketplace?${params.toString()}`);
  }

  return (
    <div className="market-shell">
      <header className="market-header">
        <div className="market-header-inner">
          <Link to="/" aria-label="GoviRoute home"><Logo size={36} onDark={false} /></Link>

          <form className="market-search" role="search" onSubmit={handleSearch} key={currentQuery}>
            <SearchIcon />
            <label htmlFor="market-search-input" className="sr-only">Search produce</label>
            <input
              id="market-search-input"
              name="q"
              type="search"
              placeholder="Search carrots, beans, leeks…"
              defaultValue={currentQuery}
            />
          </form>

          <nav className="market-nav" aria-label="Marketplace">
            <NavLink to="/marketplace">Marketplace</NavLink>
            {user ? (
              <>
                {user.role === 'FARMER' && <NavLink to="/farmer/listings">My listings</NavLink>}
                <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
              </>
            ) : (
              <>
                <Link to="/login" state={{ from: location.pathname }}>Log in</Link>
                <Link to="/register?role=BUYER" className="btn btn-primary">Join free</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <Outlet />
    </div>
  );
}