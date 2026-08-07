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

export function amenityChips(amenities) {
  if (!amenities) return [];
  return Object.entries(amenities)
    .filter(([, on]) => on)
    .map(([key]) => AMENITY_LABELS[key] || { icon: '•', label: key });
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
