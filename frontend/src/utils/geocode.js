/**
 * Address ↔ map point, using OpenStreetMap's free Nominatim service (Sri Lanka only).
 * Nominatim asks for at most one request per second, so callers wait until typing stops.
 * Both functions return null when nothing is found or the service cannot be reached.
 * @author Ashmi Hettige
 */
import { DISTRICTS } from '../constants/districts';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

// finds which of the 25 districts a Nominatim address belongs to
function districtOf(address) {
  const text = Object.values(address ?? {}).join(' ').toLowerCase();
  return DISTRICTS.find((district) => text.includes(district.toLowerCase())) ?? '';
}

// a short, readable address: "12 Galle Road, Kollupitiya, Colombo"
function shortLabel(place) {
  const a = place.address ?? {};
  const street = [a.house_number, a.road].filter(Boolean).join(' ');
  const area = a.suburb ?? a.village ?? a.hamlet ?? a.neighbourhood;
  const town = a.city ?? a.town ?? a.municipality ?? a.county;
  const parts = [street, area, town].filter(Boolean);
  return parts.length > 0 ? [...new Set(parts)].join(', ') : place.display_name.split(',').slice(0, 3).join(',');
}

export async function findAddress(text) {
  try {
    const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&countrycodes=lk&limit=1&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const [place] = await response.json();
    if (!place) return null;
    return { lat: Number(place.lat), lng: Number(place.lon), label: shortLabel(place), district: districtOf(place.address) };
  } catch {
    return null;
  }
}

export async function describePoint(lat, lng) {
  try {
    const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const place = await response.json();
    if (!place || place.error) return null;
    return { label: shortLabel(place), district: districtOf(place.address) };
  } catch {
    return null;
  }
}
