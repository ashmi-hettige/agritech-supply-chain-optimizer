/**
 * Transporter: register the lorries and vans that can be given delivery trips.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import useToast from '../../hooks/useToast';
import { formatKg } from '../../utils/format';
import '../Farmer.css';
import '../admin/Admin.css';
import './Transport.css';

const TYPES = ['Lorry', 'Truck', 'Van', 'Mini truck', 'Three-wheeler'];
const PLATE_PATTERN = /^([A-Z]{2} )?[A-Z0-9]{1,3}-\d{4}$/;
const EMPTY = { plateNo: '', type: 'Lorry', capacityKg: '', refrigerated: false };

export default function VehiclesPage() {
  const showToast = useToast();
  const [reloadCount, setReloadCount] = useState(0);
  const [vehicles, setVehicles] = useState({ list: [], error: '' });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toRemove, setToRemove] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/transporter/vehicles')
      .then(({ data }) => {
        if (!cancelled) setVehicles({ list: data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setVehicles({ list: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : name === 'plateNo' ? value.toUpperCase() : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');
    const found = {};
    if (!PLATE_PATTERN.test(form.plateNo.trim())) found.plateNo = 'Use a plate like WP LB-1234 or 45-6789';
    const capacity = Number(form.capacityKg);
    if (!/^\d+(\.\d{1,2})?$/.test(form.capacityKg) || capacity < 100 || capacity > 20000) {
      found.capacityKg = 'Capacity from 100 to 20,000 kg';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await api.post('/transporter/vehicles', { ...form, plateNo: form.plateNo.trim(), capacityKg: capacity });
      showToast(`${form.plateNo.trim()} added`);
      setForm(EMPTY);
      setReloadCount((count) => count + 1);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.delete(`/transporter/vehicles/${toRemove.id}`);
      showToast(`${toRemove.plateNo} removed`);
      setReloadCount((count) => count + 1);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setToRemove(null);
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="vehicles-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Transporter</p>
          <h1 id="vehicles-title">My vehicles</h1>
        </div>
      </div>

      <div className="admin-layout">
        <div className="table-card">
          {vehicles.error && <div className="alert alert-error" role="alert">{vehicles.error}</div>}
          {vehicles.list.length === 0 && !vehicles.error ? (
            <p className="text-muted table-empty">No vehicles yet. Add one so the admin can plan trips for you.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Plate</th>
                  <th scope="col">Type</th>
                  <th scope="col">Carries</th>
                  <th scope="col">Refrigerated</th>
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.list.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td><strong>{vehicle.plateNo}</strong></td>
                    <td>{vehicle.type}</td>
                    <td>{formatKg(vehicle.capacityKg)}</td>
                    <td>{vehicle.refrigerated ? 'Yes' : 'No'}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" className="btn btn-outline-danger btn-small" onClick={() => setToRemove(vehicle)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form className="card form admin-form" onSubmit={handleSubmit} noValidate>
          <h2>Add a vehicle</h2>
          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
          <FormField id="plateNo" label="Number plate" placeholder="WP LB-1234" value={form.plateNo}
            onChange={handleChange} error={errors.plateNo} />
          <FormField id="type" label="Type" as="select" value={form.type} onChange={handleChange} error={errors.type}>
            {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </FormField>
          <FormField id="capacityKg" label="Can carry (kg)" inputMode="decimal" placeholder="3000"
            value={form.capacityKg} onChange={handleChange} error={errors.capacityKg} />
          <label className="check-row">
            <input type="checkbox" name="refrigerated" checked={form.refrigerated} onChange={handleChange} />
            Refrigerated (can carry beans, capsicum and other cold-chain crops)
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Add vehicle'}</button>
        </form>
      </div>

      <ConfirmDialog
        open={toRemove !== null}
        title={toRemove ? `Remove ${toRemove.plateNo}?` : ''}
        message="It will not be given new trips. Vehicles that already have trips cannot be removed."
        confirmLabel="Remove vehicle"
        cancelLabel="Keep it"
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={() => setToRemove(null)}
      />
    </section>
  );
}
