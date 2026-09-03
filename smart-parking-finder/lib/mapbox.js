const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function hasMapboxToken() {
  return Boolean(MAPBOX_TOKEN);
}

// Forward geocoding: free-text query -> place suggestions, biased toward
// Lagos/Nigeria since that's where the current seed data lives.
export async function searchPlaces(query, { limit = 5 } = {}) {
  if (!MAPBOX_TOKEN || !query || query.trim().length < 3) return [];
  const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
  url.searchParams.set('access_token', MAPBOX_TOKEN);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('country', 'ng');
  url.searchParams.set('proximity', '3.3792,6.5244'); // Lagos
  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const json = await res.json().catch(() => null);
  if (!json?.features) return [];
  return json.features.map((f) => ({
    id: f.id,
    name: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));
}

// Geocodes a single address to its best-guess coordinates, or null.
export async function geocodeAddress(address) {
  const results = await searchPlaces(address, { limit: 1 });
  return results[0] || null;
}
