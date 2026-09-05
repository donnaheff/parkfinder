export function availabilityClass(lot) {
  if (!lot.is_open) return 'full';
  if (lot.available_spaces === 0) return 'full';
  if (lot.available_spaces / lot.capacity < 0.25) return 'low';
  return 'open';
}

export function availabilityText(lot) {
  if (!lot.is_open) return 'Closed';
  const cls = availabilityClass(lot);
  if (cls === 'full') return 'Full';
  if (cls === 'low') return 'Filling fast';
  return 'Available';
}

export function occupancyRatio(lot) {
  if (!lot.capacity) return 0;
  return Math.round((lot.available_spaces / lot.capacity) * 100);
}

const AMENITY_LABELS = {
  ev_charging: { icon: '⚡', label: 'EV' },
  accessible: { icon: '♿', label: 'Access' },
  motorbike: { icon: '🏍️', label: 'Bike' },
  covered: { icon: '🏠', label: 'Covered' },
  security: { icon: '🛡️', label: 'Security' },
  lighting: { icon: '💡', label: 'Lighting' },
  car_wash: { icon: '🚿', label: 'Car wash' },
};

// Amenity detail fields (e.g. EV connector type/power) live alongside the
// boolean flags in the same amenities object rather than nested, so the
// generic boolean iteration below has to know to skip them.
const AMENITY_DETAIL_KEYS = new Set(['ev_connector_type', 'ev_kw']);

export function amenityChips(amenities) {
  if (!amenities) return [];
  return Object.entries(amenities)
    .filter(([key, on]) => on && !AMENITY_DETAIL_KEYS.has(key))
    .map(([key]) => {
      if (key === 'ev_charging') {
        const detail = [amenities.ev_connector_type, amenities.ev_kw ? `${amenities.ev_kw}kW` : null].filter(Boolean).join(' · ');
        return { icon: '⚡', label: detail ? `EV (${detail})` : 'EV' };
      }
      return AMENITY_LABELS[key] || { icon: '•', label: key };
    });
}

export function priceText(lot) {
  return lot?.price_per_hour > 0 ? `₦${lot.price_per_hour}/hr` : 'Free';
}

export function directionsUrl(lot, provider = 'osm') {
  const q = encodeURIComponent(`${lot.name} ${lot.address} ${lot.area}`);
  if (provider === 'google') return `https://www.google.com/maps/search/?api=1&query=${q}`;
  if (provider === 'apple') return `https://maps.apple.com/?q=${q}`;
  return `https://www.openstreetmap.org/search?query=${q}`;
}

export function verificationLabel(status) {
  switch (status) {
    case 'verified': return 'Verified';
    case 'rejected': return 'Rejected';
    case 'more_info_requested': return 'More info requested';
    default: return 'Pending review';
  }
}

export function reservationStatusLabel(status) {
  switch (status) {
    case 'held': return 'Held';
    case 'awaiting_payment': return 'Awaiting payment';
    case 'confirmed': return 'Confirmed';
    case 'cancelled': return 'Cancelled';
    case 'completed': return 'Completed';
    default: return status;
  }
}

// Mirrors the countdown text shown by <CountdownBadge> (app/reservations/page.jsx)
// so the held-hold expiry formatting can be unit tested without rendering React.
export function holdCountdownText(expiresAt, now = Date.now()) {
  if (!expiresAt) return null;
  const remainingMs = new Date(expiresAt).getTime() - now;
  if (remainingMs <= 0) return 'Expiring…';
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  return `Expires in ${mins}:${String(secs).padStart(2, '0')}`;
}
