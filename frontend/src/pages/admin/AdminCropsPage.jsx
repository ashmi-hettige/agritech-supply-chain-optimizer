/**
 * Admin: list, add, edit and delete crops.
 * A crop that farmers have listed cannot be deleted (the server answers 409).
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import ConfirmDialog from '../../components/ConfirmDialog';
import FormField from '../../components/FormField';
import useToast from '../../hooks/useToast';
import '../Farmer.css';
import './Admin.css';

const PICTURES = ['beans', 'beetroot', 'cabbage', 'capsicum', 'carrot', 'leeks', 'potato', 'tomato', 'veg-basket'];
const EMPTY = { name: '', category: '', shelfLifeDays: '', needsColdChain: false, imageUrl: '/images/veg-basket.jpg' };

function validateCrop(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  else if (form.name.trim().length > 60) errors.name = 'At most 60 characters';
  if (!form.category.trim()) errors.category = 'Category is required';
  else if (form.category.trim().length > 30) errors.category = 'At most 30 characters';
  const days = Number(form.shelfLifeDays);
  if (!/^\d+$/.test(String(form.shelfLifeDays)) || days < 1 || days > 365) errors.shelfLifeDays = 'Whole days from 1 to 365';
  return errors;
}

export default function AdminCropsPage() {
  const showToast = useToast();
  const [reloadCount, setReloadCount] = useState(0);
  const [crops, setCrops] = useState({ count: -1, list: [], error: '' });
  const [editing, setEditing] = useState(null); // null = adding a new crop
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/crops')
      .then(({ data }) => {
        if (!cancelled) setCrops({ count: reloadCount, list: data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setCrops({ count: reloadCount, list: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadCount]);

  const reload = () => setReloadCount((count) => count + 1);

  function startEdit(crop) {
    setEditing(crop);
    setForm({ ...crop, shelfLifeDays: String(crop.shelfLifeDays), imageUrl: crop.imageUrl ?? '' });
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
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError('');
    const found = validateCrop(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const body = {
      name: form.name.trim(),
      category: form.category.trim(),
      shelfLifeDays: Number(form.shelfLifeDays),
      needsColdChain: form.needsColdChain,
      imageUrl: form.imageUrl,
    };
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/admin/crops/${editing.id}`, body);
        showToast(`${body.name} updated`);
      } else {
        await api.post('/admin/crops', body);
        showToast(`${body.name} added`);
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
      await api.delete(`/admin/crops/${toDelete.id}`);
      showToast(`${toDelete.name} deleted`);
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
    <section aria-labelledby="crops-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Logistics admin</p>
          <h1 id="crops-title">Crops</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={startAdd}>Add crop</button>
      </div>

      <div className="admin-layout">
        <div className="table-card">
          {crops.error && <div className="alert alert-error" role="alert">{crops.error}</div>}
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Crop</th>
                <th scope="col">Category</th>
                <th scope="col">Keeps for</th>
                <th scope="col">Cold chain</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {crops.list.map((crop) => (
                <tr key={crop.id} className={editing?.id === crop.id ? 'selected' : ''}>
                  <td>
                    <div className="crop-cell">
                      <img src={crop.imageUrl} alt="" />
                      <strong>{crop.name}</strong>
                    </div>
                  </td>
                  <td>{crop.category}</td>
                  <td>{crop.shelfLifeDays} days</td>
                  <td>{crop.needsColdChain ? 'Yes' : 'No'}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-outline btn-small" onClick={() => startEdit(crop)}>Edit</button>
                      <button type="button" className="btn btn-danger btn-small" onClick={() => setToDelete(crop)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="card form admin-form" onSubmit={handleSubmit} noValidate>
          <h2>{editing ? `Edit ${editing.name}` : 'New crop'}</h2>
          {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
          <FormField id="name" label="Name" value={form.name} onChange={handleChange} error={errors.name} />
          <FormField id="category" label="Category" placeholder="Root vegetable" value={form.category}
            onChange={handleChange} error={errors.category} />
          <FormField id="shelfLifeDays" label="Keeps for (days)" inputMode="numeric" value={form.shelfLifeDays}
            onChange={handleChange} error={errors.shelfLifeDays}
            hint="Used to work out each listing's expiry date and freshness." />
          <label className="check-row">
            <input type="checkbox" name="needsColdChain" checked={form.needsColdChain} onChange={handleChange} />
            Needs a refrigerated lorry
          </label>
          <div className="picture-row">
            <FormField id="imageUrl" label="Picture" as="select" value={form.imageUrl} onChange={handleChange}
              error={errors.imageUrl}>
              {PICTURES.map((name) => <option key={name} value={`/images/${name}.jpg`}>{name}</option>)}
            </FormField>
            {form.imageUrl && <img src={form.imageUrl} alt="" className="picture-preview" />}
          </div>
          <div className="form-actions">
            {editing && <button type="button" className="btn btn-outline" onClick={startAdd}>Cancel</button>}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add crop'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete ? `Delete ${toDelete.name}?` : ''}
        message="Its price history is deleted too. Crops that farmers have listed cannot be deleted."
        confirmLabel="Delete crop"
        busy={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}
