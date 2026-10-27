/**
 * The buttons under an order. Farmers confirm, reject or deliver; buyers cancel.
 * Rejecting and cancelling ask "Are you sure?" first, because they cannot be undone.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import { getErrorMessage } from '../api/client';
import { changeOrderStatus } from '../api/orders';
import useToast from '../hooks/useToast';
import ConfirmDialog from './ConfirmDialog';

export default function OrderActions({ order, viewer, onChanged }) {
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);

  async function change(status, message) {
    setBusy(true);
    try {
      await changeOrderStatus(order.id, status);
      showToast(message);
      setAsking(false);
      onChanged();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (viewer === 'FARMER' && order.status === 'PLACED') {
    return (
      <div className="order-actions">
        <button type="button" className="btn btn-outline-danger" disabled={busy} onClick={() => setAsking(true)}>
          Reject
        </button>
        <button type="button" className="btn btn-primary" disabled={busy}
          onClick={() => change('CONFIRMED', `Order #${order.id} confirmed. ${order.buyerName} has been told.`)}>
          Confirm
        </button>
        {asking && (
          <ConfirmDialog
            open
            title={`Reject order #${order.id}?`}
            message="The buyer will be told, and the kilos go back on your listing."
            confirmLabel="Reject order"
            cancelLabel="Keep order"
            busy={busy}
            onConfirm={() => change('REJECTED', `Order #${order.id} rejected. The kilos are back on your listing.`)}
            onCancel={() => setAsking(false)}
          />
        )}
      </div>
    );
  }

  if (viewer === 'FARMER' && order.status === 'CONFIRMED') {
    return (
      <div className="order-actions">
        <button type="button" className="btn btn-primary" disabled={busy}
          onClick={() => change('DELIVERED', `Order #${order.id} marked as delivered`)}>
          Mark as delivered
        </button>
      </div>
    );
  }

  if (viewer === 'BUYER' && order.status === 'PLACED') {
    return (
      <div className="order-actions">
        <button type="button" className="btn btn-outline-danger" disabled={busy} onClick={() => setAsking(true)}>
          Cancel order
        </button>
        {asking && (
          <ConfirmDialog
            open
            title={`Cancel order #${order.id}?`}
            message="The farmer will be told, and the produce goes back on sale."
            confirmLabel="Cancel order"
            cancelLabel="Keep order"
            busy={busy}
            onConfirm={() => change('CANCELLED', `Order #${order.id} cancelled`)}
            onCancel={() => setAsking(false)}
          />
        )}
      </div>
    );
  }

  return null;
}