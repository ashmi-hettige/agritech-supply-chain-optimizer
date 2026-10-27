/**
 * Sidebar links for each role. Pages are added to these lists as they are built.
 * @author Ashmi Hettige
 */
export const NAV_LINKS = {
  FARMER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/farmer/listings', label: 'My listings' },
    // showsNewOrders: the sidebar adds a count of orders waiting for the farmer
    { to: '/farmer/orders', label: 'Incoming orders', showsNewOrders: true },
  ],
  BUYER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/orders', label: 'My orders' },
    { to: '/cart', label: 'Cart' },
  ],
  TRANSPORTER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/marketplace', label: 'Marketplace' },
  ],
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/marketplace', label: 'Marketplace' },
  ],
};

export const ROLE_LABELS = {
  FARMER: 'Farmer',
  BUYER: 'Buyer',
  TRANSPORTER: 'Transporter',
  ADMIN: 'Logistics admin',
};

// shortcuts on the buyer, transporter and admin dashboards (farmers have their own dashboard)
export const QUICK_ACTIONS = {
  BUYER: [
    { to: '/marketplace', title: 'Browse produce', text: 'Search by crop, district and freshness.' },
    { to: '/marketplace?freshness=URGENT', title: 'Urgent deals', text: 'Produce that must sell in the next few days.' },
    { to: '/orders', title: 'My orders', text: 'Follow your orders and cancel ones not yet confirmed.' },
  ],
  TRANSPORTER: [
    { to: '/marketplace', title: 'See the marketplace', text: 'What farmers are selling right now.' },
  ],
  ADMIN: [
    { to: '/marketplace', title: 'See the marketplace', text: 'All produce currently on sale.' },
  ],
};