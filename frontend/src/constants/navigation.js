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
    { to: '/farmer/advisor', label: 'Best-market advisor' },
    { to: '/prices', label: 'Market prices' },
  ],
  BUYER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/orders', label: 'My orders' },
    { to: '/cart', label: 'Cart' },
    { to: '/prices', label: 'Market prices' },
  ],
  TRANSPORTER: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/transporter/trips', label: 'My trips' },
    { to: '/transporter/vehicles', label: 'My vehicles' },
    { to: '/prices', label: 'Market prices' },
    { to: '/marketplace', label: 'Marketplace' },
  ],
  ADMIN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/admin/prices', label: 'Daily prices' },
    { to: '/admin/trips', label: 'Trip planner' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/crops', label: 'Crops' },
    { to: '/admin/centres', label: 'Economic centres' },
    { to: '/prices', label: 'Market prices' },
    { to: '/marketplace', label: 'Marketplace' },
  ],
};

export const ROLE_LABELS = {
  FARMER: 'Farmer',
  BUYER: 'Buyer',
  TRANSPORTER: 'Transporter',
  ADMIN: 'Logistics admin',
};

// shortcuts on the buyer and transporter dashboards (farmers and admins have their own dashboards)
export const QUICK_ACTIONS = {
  BUYER: [
    { to: '/marketplace', title: 'Browse produce', text: 'Search by crop, district and freshness.' },
    { to: '/marketplace?freshness=URGENT', title: 'Urgent deals', text: 'Produce that must sell in the next few days.' },
    { to: '/orders', title: 'My orders', text: 'Follow your orders and cancel ones not yet confirmed.' },
  ],
  TRANSPORTER: [
    { to: '/transporter/trips', title: 'My trips', text: 'Your delivery stops in driving order.' },
    { to: '/transporter/vehicles', title: 'My vehicles', text: 'Add the lorries that can take trips.' },
  ],
};