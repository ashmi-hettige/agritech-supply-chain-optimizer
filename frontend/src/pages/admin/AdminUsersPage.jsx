/**
 * Admin: find users by role or name and turn accounts on or off.
 * Accounts are never deleted, so their orders and listings stay in the records.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import Pagination from '../../components/Pagination';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import { ROLE_LABELS } from '../../constants/navigation';
import { formatDate } from '../../utils/format';
import '../Farmer.css';
import './Admin.css';

const ROLE_FILTERS = [
  { value: '', label: 'Everyone' },
  { value: 'FARMER', label: 'Farmers' },
  { value: 'BUYER', label: 'Buyers' },
  { value: 'TRANSPORTER', label: 'Transporters' },
  { value: 'ADMIN', label: 'Admins' },
];

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const showToast = useToast();
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: '' });
  const [toDisable, setToDisable] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const key = `${role}|${search}|${page}|${reloadCount}`;
  const loading = result.key !== key;

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/users', { params: { role: role || undefined, q: search || undefined, page } })
      .then(({ data }) => {
        if (!cancelled) setResult({ key, data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setResult({ key, data: null, error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [role, search, page, key]);

  function handleSearch(event) {
    event.preventDefault();
    setSearch(new FormData(event.currentTarget).get('q').trim());
    setPage(0);
  }

  async function setEnabled(target, enabled) {
    setBusyId(target.id);
    try {
      await api.patch(`/admin/users/${target.id}/enabled`, { enabled });
      showToast(enabled ? `${target.fullName} can log in again` : `${target.fullName} is disabled`);
      setToDisable(null);
      setReloadCount((count) => count + 1);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const users = result.data?.content ?? [];

  return (
    <section aria-labelledby="users-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Logistics admin</p>
          <h1 id="users-title">Users</h1>
        </div>
      </div>

      <div className="user-filters">
        <div className="tab-row" role="group" aria-label="Role">
          {ROLE_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`tab-chip ${role === item.value ? 'on' : ''}`}
              aria-pressed={role === item.value}
              onClick={() => { setRole(item.value); setPage(0); }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form className="user-search" role="search" onSubmit={handleSearch}>
          <label htmlFor="user-search" className="sr-only">Search by name or email</label>
          <input id="user-search" name="q" className="input" placeholder="Name or email" defaultValue={search} />
          <button type="submit" className="btn btn-outline">Search</button>
        </form>
      </div>

      {result.error && <div className="alert alert-error" role="alert">{result.error}</div>}

      <div className="table-card">
        <table className={`data-table ${loading ? 'is-loading' : ''}`}>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Role</th>
              <th scope="col">Phone</th>
              <th scope="col">Joined</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.fullName}</strong>
                  <span className="cell-note">{user.email}</span>
                </td>
                <td>{ROLE_LABELS[user.role]}{user.district ? ` · ${user.district}` : ''}</td>
                <td>{user.phone ?? '–'}</td>
                <td>{formatDate(user.createdAt.slice(0, 10))}</td>
                <td>
                  <span className={`status ${user.enabled ? 'status-available' : 'status-expired'}`}>
                    {user.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    {user.enabled && user.id !== me.id && (
                      <button type="button" className="btn btn-outline-danger btn-small" disabled={busyId === user.id}
                        onClick={() => setToDisable(user)}>
                        Disable
                      </button>
                    )}
                    {!user.enabled && (
                      <button type="button" className="btn btn-outline btn-small" disabled={busyId === user.id}
                        onClick={() => setEnabled(user, true)}>
                        Enable
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} className="text-muted">No users match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {result.data && <Pagination page={result.data.page} totalPages={result.data.totalPages} onChange={setPage} />}

      <ConfirmDialog
        open={toDisable !== null}
        title={toDisable ? `Disable ${toDisable.fullName}?` : ''}
        message="They will not be able to log in. Their listings and orders stay in the records, and you can enable them again."
        confirmLabel="Disable account"
        cancelLabel="Keep active"
        busy={busyId !== null}
        onConfirm={() => setEnabled(toDisable, false)}
        onCancel={() => setToDisable(null)}
      />
    </section>
  );
}
