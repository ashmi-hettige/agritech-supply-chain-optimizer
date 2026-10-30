/**
 * Labels for order statuses, and the steps an order goes through.
 * @author Ashmi Hettige
 */
export const ORDER_STATUS_LABELS = {
  PLACED: 'Waiting for farmer',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  ASSIGNED: 'On a delivery trip',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

// the normal path of an order, shown as a progress line on My orders
export const ORDER_STEPS = ['PLACED', 'CONFIRMED', 'DELIVERED'];

export const SLOT_LABELS = { MORNING: 'Morning (6 am – 12 pm)', AFTERNOON: 'Afternoon (12 – 6 pm)' };

// tells the sidebar badge and dashboard to reload after an order changes
export const ORDERS_CHANGED_EVENT = 'orders:changed';