/**
 * Admin: enter or correct one day's prices of a crop at every economic centre.
 * Each row saves on its own; saving the same crop, centre and day again updates it.
 * @author Ashmi Hettige
 */
import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../api/client';
import useToast from '../../hooks/useToast';
import { shortCentreName, todayIso } from '../../utils/format';
import '../Farmer.css';
import './Admin.css';

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

function checkRow(row) {
  for (const field of ['minPrice', 'avgPrice', 'maxPrice']) {
    const text = String(row[field]).trim();
    if (!MONEY_PATTERN.test(text) || Number(text) < 1 || Number(text) > 10000) {
      return 'Enter prices from 1 to 10,000';
    }
  }
  if (!(Number(row.minPrice) <= Number(row.avgPrice) && Number(row.avgPrice) <= Number(row.maxPrice))) {
    return 'Prices must go lowest ≤ average ≤ highest';
  }
  return '';
}

export default function AdminPricesPage() {
  const showToast = useToast();
  const [crops, setCrops] = useState([]);
  const [centres, setCentres] = useState([]);
  const [cropId, setCropId] = useState('');
  const [date, setDate] = useState(todayIso());
  const [reloadCount, setReloadCount] = useState(0);
  const [saved, setSaved] = useState({ key: null, rows: [], error: '' });
  const [drafts, setDrafts] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [busyCentre, setBusyCentre] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/centres')])
      .then(([cropResponse, centreResponse]) => {
        setCrops(cropResponse.data);
        setCentres(centreResponse.data);
        setCropId((current) => current || String(cropResponse.data[0]?.id ?? ''));
      })
      .catch((error) => showToast(getErrorMessage(error), 'error'));
  }, [showToast]);

  const key = `${cropId}|${date}|${reloadCount}`;

  useEffect(() => {
    if (!cropId || !date) {
      return undefined;
    }
    let cancelled = false;
    api
      .get('/admin/prices', { params: { date, cropId } })
      .then(({ data }) => {
        if (!cancelled) setSaved({ key, rows: data, error: '' });
      })
      .catch((error) => {
        if (!cancelled) setSaved({ key, rows: [], error: getErrorMessage(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [cropId, date, key]);

  const loading = saved.key !== key;

  function chooseFilter(setter, value) {
    setter(value);
    setDrafts({});
    setRowErrors({});
  }

  // what each row shows: the draft being typed, else the saved price, else empty boxes
  function rowFor(centre) {
    const existing = saved.rows.find((row) => row.centreId === centre.id);
    return drafts[centre.id] ?? {
      minPrice: existing ? String(existing.minPrice) : '',
      avgPrice: existing ? String(existing.avgPrice) : '',
      maxPrice: existing ? String(existing.maxPrice) : '',
    };
  }

  function changeCell(centre, field, value) {
    setDrafts((current) => ({ ...current, [centre.id]: { ...rowFor(centre), [field]: value } }));
    setRowErrors((current) => ({ ...current, [centre.id]: '' }));
  }

  async function saveRow(centre) {
    const row = rowFor(centre);
    const problem = checkRow(row);
    if (problem) {
      setRowErrors((current) => ({ ...current, [centre.id]: problem }));
      return;
    }
    setBusyCentre(centre.id);
    try {
      await api.put('/admin/prices', {
        cropId: Number(cropId),
        centreId: centre.id,
        priceDate: date,
        minPrice: Number(row.minPrice),
        avgPrice: Number(row.avgPrice),
        maxPrice: Number(row.maxPrice),
      });
      showToast(`Saved ${shortCentreName(centre.name)}`);
      setDrafts((current) => {
        const next = { ...current };
        delete next[centre.id];
        return next;
      });
      setReloadCount((count) => count + 1);
    } catch (error) {
      setRowErrors((current) => ({ ...current, [centre.id]: getErrorMessage(error) }));
    } finally {
      setBusyCentre(null);
    }
  }

  async function deleteRow(centre, priceId) {
    setBusyCentre(centre.id);
    try {
      await api.delete(`/admin/prices/${priceId}`);
      showToast(`Removed the ${shortCentreName(centre.name)} price`);
      setReloadCount((count) => count + 1);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    } finally {
      setBusyCentre(null);
    }
  }

  const cropName = crops.find((crop) => String(crop.id) === cropId)?.name ?? '';

  return (
    <section aria-labelledby="admin-prices-title">
      <div className="page-header">
        <div>
          <p className="eyebrow">Logistics admin</p>
          <h1 id="admin-prices-title">Daily prices</h1>
        </div>
      </div>

      <div className="card price-filters">
        <label className="field">
          <span className="field-label">Crop</span>
          <select className="input" value={cropId} onChange={(event) => chooseFilter(setCropId, event.target.value)}>
            {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Date</span>
          <input className="input" type="date" max={todayIso()} value={date}
            onChange={(event) => chooseFilter(setDate, event.target.value)} />
        </label>
        <p className="field-hint">Prices are LKR per kg. Saving a centre that already has a price replaces it.</p>
      </div>

      {saved.error && <div className="alert alert-error" role="alert">{saved.error}</div>}

      <div className="table-card">
        <table className="data-table price-entry">
          <caption className="sr-only">{cropName} prices on {date}</caption>
          <thead>
            <tr>
              <th scope="col">Centre</th>
              <th scope="col">Lowest</th>
              <th scope="col">Average</th>
              <th scope="col">Highest</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {centres.map((centre) => {
              const row = rowFor(centre);
              const existing = saved.rows.find((item) => item.centreId === centre.id);
              const busy = busyCentre === centre.id;
              return (
                <tr key={centre.id}>
                  <td>
                    <strong>{shortCentreName(centre.name)}</strong>
                    <span className="cell-note">{existing ? 'Saved' : loading ? '…' : 'No price yet'}</span>
                    {rowErrors[centre.id] && <span className="field-error">{rowErrors[centre.id]}</span>}
                  </td>
                  {['minPrice', 'avgPrice', 'maxPrice'].map((field) => (
                    <td key={field}>
                      <input
                        className="input price-input"
                        inputMode="decimal"
                        aria-label={`${field.replace('Price', '')} price at ${shortCentreName(centre.name)}`}
                        value={row[field]}
                        onChange={(event) => changeCell(centre, field, event.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn btn-primary btn-small" disabled={busy} onClick={() => saveRow(centre)}>
                        Save
                      </button>
                      {existing && (
                        <button type="button" className="btn btn-outline btn-small" disabled={busy}
                          onClick={() => deleteRow(centre, existing.id)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
