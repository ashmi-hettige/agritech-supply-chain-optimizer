/**
 * Admin: list, add, edit and delete economic centres. Their location is used by the advisor.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import useToast from '../../hooks/useToast';
import { DISTRICTS } from '../../constants/districts';
import { shortCentreName } from '../../utils/format';
import '../Farmer.css';
import './Admin.css';

const EMPTY = { name: '', district: '', latitude: '', longitude: '' };

function inRange(value, min, max) {
  const number = Number(value);
  return String(value).trim() !== '' && !Number.isNaN(number) && number >= min && number <= max;
}

function validateCentre(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  else if (form.name.trim().length > 80) errors.name = 'At most 80 characters';
  if (!form.district) errors.district = 'Choose a district';
  if (!inRange(form.latitude, 5.9, 9.9)) errors.latitude = 'Latitude must be between 5.9 and 9.9';
  if (!inRange(form.longitude, 79.5, 81.9)) errors.longitude = 'Longitude must be between 79.5 and 81.9';
  return errors;
}

export default function AdminCentresPage() {
  const showToast = useToast();
  const [reloadCount, setReloadCount] = useState(0);
  const [centres, setCentres] = useState({ list: [], error: '' });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/centres')
      .then(({ data }) => {
        if (!cancelled) setCentres({ list: data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setCentres({ list: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  function startEdit(centre) {
    setEditing(centre);
    setForm({ name: centre.name, district: centre.district ?? '', latitude: String(centre.latitude), longitude: String(centre.longitude) });
    setErrors({});
    setServerError('');
  }

  function startAdd() {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setServerError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');
    const found = validateCentre(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      name: form.name.trim(),
      district: form.district,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/admin/centres/${editing.id}`, body);
        showToast(`${shortCentreName(body.name)} updated`);
      } else {
        await api.post('/admin/centres', body);
        showToast(`${shortCentreName(body.name)} added`);
      }
      startAdd();
      reload();
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await api.delete(`/admin/centres/${toDelete.id}`);
      showToast(`${shortCentreName(toDelete.name)} deleted`);
      if (editing?.id === toDelete.id) startAdd();
      setToDelete(null);
      reload();
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="centres-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Logistics admin</p>
          <h1 id="centres-title">Economic centres</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={startAdd}>Add centre</button>
      </div>

      <div className="admin-layout">
        <div className="table-card">
          {centres.error && <div className="alert alert-error" role="alert">{centres.error}</div>}
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Centre</th>
                <th scope="col">District</th>
                <th scope="col">Location</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {centres.list.map((centre) => (
                <tr key={centre.id} className={editing?.id === centre.id ? 'selected' : ''}>
                  <td><strong>{centre.name}</strong></td>
                  <td>{centre.district}</td>
                  <td>{centre.latitude.toFixed(4)}, {centre.longitude.toFixed(4)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-outline btn-small" onClick={() => startEdit(centre)}>Edit</button>
                      <button type="button" className="btn btn-danger btn-small" onClick={() => setToDelete(centre)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="card form admin-form" onSubmit={handleSubmit} noValidate>
          <h2>{editing ? `Edit ${shortCentreName(editing.name)}` : 'New centre'}</h2>
          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
          <FormField id="name" label="Name" placeholder="Embilipitiya Economic Centre" value={form.name}
            onChange={handleChange} error={errors.name} />
          <FormField id="district" label="District" as="select" value={form.district} onChange={handleChange}
            error={errors.district}>
            <option value="">Choose a district</option>
            {DISTRICTS.map((district) => <option key={district} value={district}>{district}</option>)}
          </FormField>
          <div className="form-row">
            <FormField id="latitude" label="Latitude" inputMode="decimal" placeholder="6.33" value={form.latitude}
              onChange={handleChange} error={errors.latitude} />
            <FormField id="longitude" label="Longitude" inputMode="decimal" placeholder="80.85" value={form.longitude}
              onChange={handleChange} error={errors.longitude} />
          </div>
          <p className="field-hint">Find the point on Google Maps: right-click the market and copy the two numbers.</p>
          <div className="form-actions">
            {editing && <button type="button" className="btn btn-outline" onClick={startAdd}>Cancel</button>}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add centre'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete ? `Delete ${shortCentreName(toDelete.name)}?` : ''}
        message="Its price history is deleted too, and the advisor stops suggesting it."
        confirmLabel="Delete centre"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
