/**
 * Farmer: book a transporter for a confirmed order. Choose a date and morning or afternoon,
 * see who has room, and send a request. The transporter accepts or declines.
 * @author Ashmi Hettige
 */
import { useState } from 'react';
import api, { getErrorMessage } from '../api/client';
import { SLOT_LABELS } from '../constants/orders';
import useToast from '../hooks/useToast';
import { formatDate, formatKg, todayIso } from '../utils/format';

export default function TransportPanel({ order, request, onChanged }) {
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [slot, setSlot] = useState('MORNING');
  const [options, setOptions] = useState(null);
  const [choice, setChoice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function findTransporters() {
    setBusy(true);
    setError('');
    setChoice('');
    try {
      const { data } = await api.get('/delivery/options', { params: { orderId: order.id, date, slot } });
      setOptions(data);
    } catch (problem) {
      setOptions(null);
      setError(getErrorMessage(problem));
    } finally {
      setBusy(false);
    }
  }

  async function sendRequest() {
    if (!choice) {
      setError('Choose a transporter');
      return;
    }
    setBusy(true);
    try {
      await api.post('/delivery/requests', { orderId: order.id, transporterId: Number(choice), tripDate: date, slot });
      const name = options.find((option) => String(option.transporterId) === choice)?.transporterName;
      showToast(`Request sent to ${name}. You will see their answer here.`);
      setOpen(false);
      onChanged();
    } catch (problem) {
      setError(getErrorMessage(problem));
    } finally {
      setBusy(false);
    }
  }

  async function cancelRequest() {
    setBusy(true);
    try {
      await api.patch(`/delivery/requests/${request.id}/cancel`);
      showToast('Request cancelled');
      onChanged();
    } catch (problem) {
      showToast(getErrorMessage(problem), 'error');
    } finally {
      setBusy(false);
    }
  }

  if (request?.status === 'PENDING') {
    return (
      <div className="transport-panel">
        <div className="transport-waiting">
          <span>
            Waiting for <strong>{request.transporterName}</strong> to accept ·{' '}
            {formatDate(request.tripDate)}, {SLOT_LABELS[request.slot].split(' (')[0].toLowerCase()}
          </span>
          <button type="button" className="btn btn-outline btn-small" onClick={cancelRequest} disabled={busy}>
            Cancel request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="transport-panel">
      {request?.status === 'DECLINED' && (
        <p className="transport-declined">{request.transporterName} declined. Please choose another transporter.</p>
      )}

      {!open && (
        <div className="transport-waiting">
          <span>Book a transporter to collect this order, or deliver it yourself.</span>
          <button type="button" className="btn btn-primary btn-small" onClick={() => setOpen(true)}>
            Arrange transport
          </button>
        </div>
      )}

      {open && (
        <>
          <h3>Arrange transport for {formatKg(order.totalKg)}</h3>
          <div className="transport-search">
            <label className="field">
              <span className="field-label">Date</span>
              <input className="input" type="date" min={todayIso()} value={date}
                onChange={(event) => { setDate(event.target.value); setOptions(null); }} />
            </label>
            <label className="field">
              <span className="field-label">Time</span>
              <select className="input" value={slot} onChange={(event) => { setSlot(event.target.value); setOptions(null); }}>
                {Object.entries(SLOT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <button type="button" className="btn btn-outline" onClick={findTransporters} disabled={busy}>
              {busy && !options ? 'Searching…' : 'Find transporters'}
            </button>
            <button type="button" className="link-button" onClick={() => setOpen(false)}>Close</button>
          </div>

          {error && <p className="field-error">{error}</p>}

          {options && options.length === 0 && (
            <p className="text-muted">No transporter has room then. Try the other time or another day.</p>
          )}

          {options && options.length > 0 && (
            <>
              <fieldset className="transport-options">
                <legend className="sr-only">Transporters with room</legend>
                {options.map((option) => (
                  <label key={option.transporterId} className="transport-option">
                    <input type="radio" name={`transporter-${order.id}`} value={option.transporterId}
                      checked={choice === String(option.transporterId)} onChange={(event) => setChoice(event.target.value)} />
                    <div>
                      <strong>{option.transporterName}{option.district ? ` · ${option.district}` : ''}</strong>
                      <span>
                        {option.vehicleType} {option.plateNo}{option.refrigerated ? ' · refrigerated' : ''} ·{' '}
                        {formatKg(option.spaceLeftKg)} free {option.phone ? `· ${option.phone}` : ''}
                      </span>
                      {option.joinsTrip && (
                        <span className="share-tag">Shares a lorry already going ({option.stopsAlready} stops)</span>
                      )}
                    </div>
                  </label>
                ))}
              </fieldset>
              <div className="order-actions">
                <button type="button" className="btn btn-primary" onClick={sendRequest} disabled={busy || !choice}>
                  {busy ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
