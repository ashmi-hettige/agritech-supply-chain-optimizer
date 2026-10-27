/**
 * Farmer's own listings: a table with edit, pause/resume and delete actions.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import FreshnessBadge from '../components/FreshnessBadge';
import StatusBadge from '../components/StatusBadge';
import useToast from '../hooks/useToast';
import { formatKg, formatPrice } from '../utils/format';
import './Farmer.css';

export default function MyListingsPage() {
  const showToast = useToast();
  const navigate = useNavigate();

  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ count: -1, listings: [], error: '' });
  const [toDelete, setToDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const loading = result.count !== reloadCount;

  useEffect(() => {
    let cancelled = false;
    api
      .get('/listings/mine')
      .then((response) => {
        if (!cancelled) setResult({ count: reloadCount, listings: response.data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setResult({ count: reloadCount, listings: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  async function changeStatus(listing, status) {
    setBusyId(listing.id);
    try {
      await api.patch(`/listings/${listing.id}/status`, { status });
      showToast(status === 'PAUSED' ? `${listing.cropName} is paused` : `${listing.cropName} is back on sale`);
      reload();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    setBusyId(toDelete.id);
    try {
      const response = await api.delete(`/listings/${toDelete.id}`);
      showToast(response.data.message);
      setToDelete(null);
      reload();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const { listings } = result;

  return (
    <section aria-labelledby="listings-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Farmer</p>
          <h1 id="listings-title">My listings</h1>
        </div>
        <Link to="/farmer/listings/new" className="btn btn-primary">Add listing</Link>
      </div>

      {loading && listings.length === 0 && <p className="text-muted">Loading your listings…</p>}
      {result.error && <div className="alert alert-error" role="alert">{result.error}</div>}

      {!loading && !result.error && listings.length === 0 && (
        <div className="empty-state">
          <h2>No listings yet</h2>
          <p className="text-muted">Add your first harvest so buyers can find it in the marketplace.</p>
          <Link to="/farmer/listings/new" className="btn btn-primary">Add your first listing</Link>
        </div>
      )}

      {listings.length > 0 && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Crop</th>
                <th scope="col">Available</th>
                <th scope="col">Price</th>
                <th scope="col">Freshness</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => {
                const busy = busyId === listing.id;
                const canPause = listing.status === 'AVAILABLE';
                const canResume = listing.status === 'PAUSED';
                return (
                  <tr key={listing.id}>
                    <td>
                      <div className="crop-cell">
                        <img src={listing.cropImageUrl} alt="" />
                        <div>
                          <strong>{listing.cropName}</strong>
                          <span>Grade {listing.grade} · {listing.district}</span>
                        </div>
                      </div>
                    </td>
                    <td>{formatKg(listing.availableKg)}<span className="cell-note">of {formatKg(listing.quantityKg)}</span></td>
                    <td>{formatPrice(listing.pricePerKg)}/kg</td>
                    <td><FreshnessBadge label={listing.freshnessLabel} daysLeft={listing.daysLeft} /></td>
                    <td><StatusBadge status={listing.status} /></td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-outline btn-small"
                          onClick={() => navigate(`/farmer/listings/${listing.id}/edit`)}>
                          Edit
                        </button>
                        {canPause && (
                          <button type="button" className="btn btn-outline btn-small" disabled={busy}
                            onClick={() => changeStatus(listing, 'PAUSED')}>
                            Pause
                          </button>
                        )}
                        {canResume && (
                          <button type="button" className="btn btn-outline btn-small" disabled={busy}
                            onClick={() => changeStatus(listing, 'AVAILABLE')}>
                            Resume
                          </button>
                        )}
                        <button type="button" className="btn btn-danger btn-small" disabled={busy}
                          onClick={() => setToDelete(listing)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete ? `Delete ${toDelete.cropName} listing?` : ''}
        message="Buyers won't see it any more. If it already has orders, it is archived instead."
        confirmLabel="Delete listing"
        busy={toDelete !== null && busyId === toDelete.id}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}