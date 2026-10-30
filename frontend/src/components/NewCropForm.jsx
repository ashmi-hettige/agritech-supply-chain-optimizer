/**
 * Small form inside the listing page for a crop that is missing from the list.
 * The new crop is saved for everyone, so other farmers can list it too.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import api, { getErrorMessage, getFieldErrors } from '../api/client';
import useToast from '../hooks/useToast';
import FormField from './FormField';

const CATEGORIES = ['Leafy vegetable', 'Root vegetable', 'Fruit vegetable', 'Legume', 'Tuber', 'Allium', 'Fruit', 'Grain', 'Other'];

export default function NewCropForm({ onAdded, onCancel }) {
  const showToast = useToast();
  const [form, setForm] = useState({ name: '', category: '', shelfLifeDays: '', needsColdChain: false });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  // a button, not a form, because it sits inside the listing form
  async function save() {
    const found = {};
    if (!form.name.trim()) found.name = 'Name is required';
    else if (form.name.trim().length > 60) found.name = 'At most 60 characters';
    if (!form.category) found.category = 'Choose a category';
    const days = Number(form.shelfLifeDays);
    if (!/^\d+$/.test(form.shelfLifeDays) || days < 1 || days > 365) found.shelfLifeDays = 'Whole days from 1 to 365';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setServerError('');
    try {
      const { data } = await api.post('/crops', {
        name: form.name.trim(),
        category: form.category,
        shelfLifeDays: days,
        needsColdChain: form.needsColdChain,
        imageUrl: '',
      });
      showToast(`${data.name} added to the crop list`);
      onAdded(data);
    } catch (error) {
      setErrors(getFieldErrors(error));
      setServerError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="new-crop-box" role="group" aria-label="Add a new crop">
      <strong>New crop</strong>
      {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
      <div className="form-row">
        <FormField id="newCropName" name="name" label="Crop name" placeholder="e.g. Pumpkin"
          value={form.name} onChange={handleChange} error={errors.name} />
        <FormField id="newCropCategory" name="category" label="Category" as="select"
          value={form.category} onChange={handleChange} error={errors.category}>
          <option value="">Choose</option>
          {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
        </FormField>
      </div>
      <FormField id="newCropShelfLife" name="shelfLifeDays" label="Keeps fresh for (days)" inputMode="numeric"
        placeholder="14" value={form.shelfLifeDays} onChange={handleChange} error={errors.shelfLifeDays}
        hint="Sets when your listing expires and its freshness badge." />
      <label className="check-row">
        <input type="checkbox" name="needsColdChain" checked={form.needsColdChain} onChange={handleChange} />
        Needs a refrigerated lorry
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-outline btn-small" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary btn-small" onClick={save} disabled={saving}>
          {saving ? 'Adding…' : 'Add crop'}
        </button>
      </div>
    </div>
  );
}
