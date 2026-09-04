import { getSupabaseClient } from './supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

async function authHeader() {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    // Supabase env vars not configured, or no session yet — fine for public endpoints.
    return {};
  }
}

async function request(path, options = {}) {
  const auth = await authHeader();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...auth, ...(options.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json.data;
}

export function getParks(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const qs = search.toString();
  return request(`/api/parks${qs ? `?${qs}` : ''}`);
}

export function getPark(id) {
  return request(`/api/parks/${id}`);
}

export function getAreas() {
  return request('/api/areas');
}

// The following all require a signed-in session — the server derives the
// caller's identity from the Authorization header, never from a parameter
// the client could spoof.

export function getSavedParks() {
  return request('/api/saved');
}

export function saveParkingLot(parkingLotId) {
  return request('/api/saved', {
    method: 'POST',
    body: JSON.stringify({ parking_lot_id: parkingLotId }),
  });
}

export function unsaveParkingLot(parkingLotId) {
  return request(`/api/saved/${parkingLotId}`, { method: 'DELETE' });
}

export function getMyOwnerProfile() {
  return request('/api/owner/me');
}

export function registerOwner({ name, phone, business_name }) {
  return request('/api/owner/register', {
    method: 'POST',
    body: JSON.stringify({ name, phone, business_name }),
  });
}

export function getOwnerParks() {
  return request('/api/owner/parks');
}

export function createOwnerPark(body) {
  return request('/api/owner/parks', { method: 'POST', body: JSON.stringify(body) });
}

export function updateAvailability(id, availableSpaces) {
  return request(`/api/owner/parks/${id}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ available_spaces: availableSpaces }),
  });
}

export function updateOpenStatus(id, isOpen) {
  return request(`/api/owner/parks/${id}/open-status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_open: isOpen }),
  });
}

export function getUpdates(parkingLotId) {
  const qs = parkingLotId ? `?parking_lot_id=${encodeURIComponent(parkingLotId)}` : '';
  return request(`/api/updates${qs}`);
}

export function postUpdate(body) {
  return request('/api/updates', { method: 'POST', body: JSON.stringify(body) });
}

export function getAdminSubmissions() {
  return request('/api/admin/submissions');
}

export function adminDecision(id, action, notes) {
  return request(`/api/admin/parks/${id}/${action}`, {
    method: 'PATCH',
    body: JSON.stringify({ notes: notes || '' }),
  });
}

export function getReservations() {
  return request('/api/reservations');
}

export function createReservation({ parking_lot_id, start_time, end_time }) {
  return request('/api/reservations', {
    method: 'POST',
    body: JSON.stringify({ parking_lot_id, start_time, end_time }),
  });
}

export function confirmReservation(id) {
  return request(`/api/reservations/${id}/confirm`, { method: 'PATCH' });
}

export function cancelReservation(id) {
  return request(`/api/reservations/${id}/cancel`, { method: 'PATCH' });
}

export function payForReservation(id) {
  return request(`/api/reservations/${id}/pay`, { method: 'POST' });
}

export function getReviews(parkingLotId) {
  return request(`/api/reviews?parking_lot_id=${encodeURIComponent(parkingLotId)}`);
}

export function postReview({ parking_lot_id, rating, comment, photo_urls }) {
  return request('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({ parking_lot_id, rating, comment, photo_urls }),
  });
}

export function deleteReview(id) {
  return request(`/api/reviews/${id}`, { method: 'DELETE' });
}

export function uploadPhoto({ data, mime, url }) {
  return request('/api/uploads/photo', {
    method: 'POST',
    body: JSON.stringify(url ? { url } : { data, mime }),
  });
}
