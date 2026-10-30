/**
 * Pick a point on a map of Sri Lanka: tap the map or drag the pin, or use the device's location.
 * Coordinates can still be typed by hand (keyboard users, or people who know them).
 * After the user places the pin, the place's address is looked up and shown (and passed to onPlaceFound).
 * Map tiles: OpenStreetMap, shown with the required attribution.
 * @author Ashmi Hettige
 */
import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useToast from '../hooks/useToast';
import { MapPinIcon } from './Icons';
import { describePoint } from '../utils/geocode';

const SRI_LANKA_CENTRE = [7.87, 80.77];
const SRI_LANKA_BOUNDS = [[5.7, 79.3], [10.1, 82.1]];

// a simple SVG pin, so no marker image files are needed
const PIN = L.divIcon({
  className: 'map-pin',
  html: '<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 39C15 39 2 23.5 2 14a13 13 0 0 1 26 0c0 9.5-13 25-13 25z" fill="#133f24" stroke="#fefefe" stroke-width="2"/><circle cx="15" cy="14" r="5" fill="#9ac540"/></svg>',
  iconSize: [30, 40],
  iconAnchor: [15, 39],
});

function ClickToPick({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

// moves the map when the point is set from outside (current location, district change)
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 13), { duration: 0.8 });
  }, [map, target]);
  return null;
}

function hasNumber(value) {
  return value !== '' && value !== null && value !== undefined && !Number.isNaN(Number(value));
}

export default function MapPicker({
  id, label, lat, lng, onChange, onPlaceFound, error, focus, fallbackCentre, hint,
}) {
  const showToast = useToast();
  const [flyTarget, setFlyTarget] = useState(null);
  const [locating, setLocating] = useState(false);
  // the address found for the pin the user placed: { key: "lat,lng", label }
  const [place, setPlace] = useState(null);
  const lookupCount = useRef(0);

  const position = hasNumber(lat) && hasNumber(lng) ? [Number(lat), Number(lng)] : null;

  function pick(newLat, newLng) {
    const latText = newLat.toFixed(5);
    const lngText = newLng.toFixed(5);
    onChange(latText, lngText);

    // look up the address; only the newest lookup counts if the pin moves again quickly
    const lookup = ++lookupCount.current;
    describePoint(latText, lngText).then((found) => {
      if (lookup !== lookupCount.current || !found) return;
      setPlace({ key: `${latText},${lngText}`, label: found.label });
      if (onPlaceFound) onPlaceFound(found);
    });
  }

  const placeLabel = place && position && place.key === `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`
    ? place.label
    : null;

  function locateMe() {
    if (!navigator.geolocation) {
      showToast('Your browser cannot share its location. Tap the map instead.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (where) => {
        pick(where.coords.latitude, where.coords.longitude);
        setFlyTarget([where.coords.latitude, where.coords.longitude]);
        setLocating(false);
      },
      () => {
        showToast('Location permission was denied. Tap the map instead.', 'error');
        setLocating(false);
      },
    );
  }

  return (
    <div className="map-picker">
      <div className="map-picker-head">
        <span className="field-label" id={`${id}-label`}>{label}</span>
        <button type="button" className="btn btn-outline btn-small" onClick={locateMe} disabled={locating}>
          {locating ? 'Finding you…' : 'Use my current location'}
        </button>
      </div>

      <MapContainer
        center={position ?? fallbackCentre ?? SRI_LANKA_CENTRE}
        zoom={position ? 13 : fallbackCentre ? 11 : 7}
        minZoom={7}
        maxBounds={SRI_LANKA_BOUNDS}
        scrollWheelZoom={false}
        className={`map-box ${error ? 'map-box-invalid' : ''}`}
        aria-labelledby={`${id}-label`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPick onPick={pick} />
        <FlyTo target={flyTarget} />
        <FlyTo target={focus} />
        {position && (
          <Marker
            position={position}
            icon={PIN}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const point = event.target.getLatLng();
                pick(point.lat, point.lng);
              },
            }}
          />
        )}
      </MapContainer>

      {placeLabel && <p className="map-place"><MapPinIcon size={15} /> {placeLabel}</p>}
      <p className={error ? 'field-error' : 'field-hint'} id={`${id}-help`}>
        {error || (position
          ? `Pin at ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}. Drag the pin or tap the map to move it.`
          : hint ?? 'Tap the map to drop a pin. Zoom in with + for a more exact point.')}
      </p>

      <details className="map-manual">
        <summary>Type the coordinates instead</summary>
        <div className="form-row">
          <label className="field">
            <span className="field-label">Latitude</span>
            <input className="input" inputMode="decimal" placeholder="7.85" value={lat ?? ''}
              onChange={(event) => onChange(event.target.value, lng ?? '')} />
          </label>
          <label className="field">
            <span className="field-label">Longitude</span>
            <input className="input" inputMode="decimal" placeholder="80.65" value={lng ?? ''}
              onChange={(event) => onChange(lat ?? '', event.target.value)} />
          </label>
        </div>
      </details>
    </div>
  );
}
