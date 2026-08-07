const ADMIN_TOKEN_KEY = 'parkswift-admin-token';
const USER_ID_KEY = 'parkswift-user-id';
const OWNER_KEY = 'parkswift-owner';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json.data;
}

export function getUserId() {
  if (typeof window === 'undefined') return 'user_demo';
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = `user_${Date.now().toString(36)}${Math.random().toString(16).slice(2, 8)}`;
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getStoredOwner() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(OWNER_KEY));
  } catch {
    return null;
  }
}

export function storeOwner(owner) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OWNER_KEY, JSON.stringify(owner));
}

export function clearStoredOwner() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(OWNER_KEY);
}

export function getAdminToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

export function storeAdminToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
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

export function getSavedParks(userId) {
  return request(`/api/saved?user_id=${encodeURIComponent(userId)}`);
}

export function saveParkingLot(userId, parkingLotId) {
  return request('/api/saved', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, parking_lot_id: parkingLotId }),
  });
}

export function unsaveParkingLot(userId, parkingLotId) {
  return request(`/api/saved/${parkingLotId}?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}

export function registerOwner({ name, email, phone, business_name }) {
  return request('/api/owner/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, business_name }),
  });
}

export function getOwnerParks(ownerId) {
  return request(`/api/owner/parks?owner_id=${encodeURIComponent(ownerId)}`);
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

export function getAdminSubmissions(adminToken) {
  return request('/api/admin/submissions', { headers: { 'x-admin-token': adminToken } });
}

export function adminDecision(id, action, notes, adminToken) {
  return request(`/api/admin/parks/${id}/${action}`, {
    method: 'PATCH',
    headers: { 'x-admin-token': adminToken },
    body: JSON.stringify({ notes: notes || '' }),
  });
}
