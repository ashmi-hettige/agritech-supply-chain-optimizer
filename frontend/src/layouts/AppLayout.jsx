/**
 * Layout for logged-in pages: dark sidebar with role-based links, page content on the right.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Logo from '../components/Logo';
import SidebarPrices from '../components/SidebarPrices';
import { LogoutIcon } from '../components/Icons';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import { NAV_LINKS, ROLE_LABELS } from '../constants/navigation';
import { ORDERS_CHANGED_EVENT } from '../constants/orders';
import './AppLayout.css';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newOrders, setNewOrders] = useState(0);

  const links = NAV_LINKS[user.role] ?? [];
  const isFarmer = user.role === 'FARMER';

  // farmers: count of orders waiting for a reply, reloaded whenever an order changes
  useEffect(() => {
    if (!isFarmer) {
      return undefined;
    }
    let cancelled = false;
    const load = () => {
      api
        .get('/orders/summary')
        .then(({ data }) => {
          if (!cancelled) setNewOrders(data.newOrders);
        })
        .catch(() => {
          // the badge is a nice extra; the menu works without it
        });
    };
    load();
    window.addEventListener(ORDERS_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(ORDERS_CHANGED_EVENT, load);
    };
  }, [isFarmer]);

  function handleLogout() {
    logout();
    showToast('You have logged out');
    navigate('/');
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/dashboard" aria-label="GoviRoute dashboard" className="sidebar-logo">
            <Logo size={34} />
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="sidebar-nav"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>

        <nav id="sidebar-nav" aria-label={`${ROLE_LABELS[user.role]} menu`} className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className="sidebar-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
              {link.showsNewOrders && newOrders > 0 && (
                <span className="nav-badge" aria-label={`${newOrders} new`}>{newOrders}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {user.role === 'FARMER' && <SidebarPrices />}

          <div className="sidebar-user">
            <span className="avatar" aria-hidden="true">{initials(user.fullName)}</span>
            <div className="sidebar-user-text">
              <strong>{user.fullName}</strong>
              <span>
                {ROLE_LABELS[user.role]}
                {user.district ? ` · ${user.district}` : ''}
              </span>
            </div>
            <button type="button" className="logout-button" onClick={handleLogout} aria-label="Log out" title="Log out">
              <LogoutIcon size={18} />
            </button>
          </div>

          <p className="sidebar-copy">© 2026 GoviRoute. All rights reserved.</p>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}