/**
 * Order API calls shared by the buyer and farmer pages.
 * @author Ashmi Hettige
 */
import api from './client';
import { ORDERS_CHANGED_EVENT } from '../constants/orders';

export async function changeOrderStatus(orderId, status) {
  const { data } = await api.patch(`/orders/${orderId}/status`, { status });
  // lets the sidebar badge and dashboard cards refresh
  window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
  return data;
}