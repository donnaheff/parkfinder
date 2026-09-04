import { headers } from 'next/headers';

// Server Component data fetching for the public pages (Phase 10). These hit
// the same api/* endpoints lib/api.js uses client-side — kept as a thin
// fetch wrapper rather than querying Supabase directly, so the query logic
// (filters, RLS-equivalent shaping) lives in exactly one place.
//
// Bypasses lib/api.js's authHeader()/getSupabaseClient() entirely: none of
// the reads here need auth, and that wrapper is oriented around the
// browser's live Supabase session, which doesn't exist in a server context.
async function baseUrl() {
  // Local/test override — same variable lib/api.js uses client-side, so a
  // `next dev` run pointed at the local JSON demo backend
  // (NEXT_PUBLIC_API_BASE=http://localhost:8787, see playwright.config.js)
  // fetches from the same place server-side and client-side.
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE;
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const h = await headers();
  const proto = h.get('x-forwarded-proto') || 'http';
  return `${proto}://${h.get('host')}`;
}

async function serverRequest(path) {
  try {
    const base = await baseUrl();
    const res = await fetch(`${base}${path}`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) return { data: null, error: json.error || `Request failed (${res.status})` };
    return { data: json.data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function getParksServer(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const qs = search.toString();
  const { data, error } = await serverRequest(`/api/parks${qs ? `?${qs}` : ''}`);
  return { lots: data || [], error };
}

export async function getParkServer(id) {
  const { data, error } = await serverRequest(`/api/parks/${id}`);
  return { lot: data, error };
}

export async function getAreasServer() {
  const { data, error } = await serverRequest('/api/areas');
  return { areas: data || [], error };
}

export async function getUpdatesServer() {
  const { data, error } = await serverRequest('/api/updates');
  return { updates: data || [], error };
}

export async function getReviewsServer(parkingLotId) {
  // Reviews are a secondary feature — the demo backend doesn't implement
  // this route at all (404s), so a missing/failed fetch degrades to an
  // empty list rather than failing the whole lot detail page.
  const { data } = await serverRequest(`/api/reviews?parking_lot_id=${encodeURIComponent(parkingLotId)}`);
  return data || [];
}
