// Haversine great-circle distance in meters between two {lat, lng} points.
export function distanceMeters(a, b) {
  if (!a || !b) return null;
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// A rough walking-time estimate (~80m/min) from a distance in meters.
export function walkMinutes(meters) {
  if (meters == null) return null;
  return Math.max(1, Math.round(meters / 80));
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Could not get your location.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
