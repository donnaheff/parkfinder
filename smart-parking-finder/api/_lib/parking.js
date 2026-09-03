function normalizeAmenityKey(value) {
  const map = { ev: 'ev_charging', accessible: 'accessible', motorbike: 'motorbike', bike: 'motorbike', covered: 'covered', security: 'security', lighting: 'lighting' };
  return map[value] || value;
}
function lotFromBody(body, ownerId) {
  const capacity = Math.max(1, Number(body.capacity || 1));
  return {
    owner_id: ownerId || body.owner_id || null,
    name: String(body.name || '').trim(),
    area: String(body.area || '').trim(),
    city: String(body.city || '').trim() || 'Lagos',
    country: String(body.country || '').trim() || 'Nigeria',
    type: String(body.type || 'Open car park').trim(),
    address: String(body.address || '').trim(),
    latitude: body.latitude == null ? null : Number(body.latitude),
    longitude: body.longitude == null ? null : Number(body.longitude),
    capacity,
    available_spaces: Math.max(0, Math.min(capacity, Number(body.available_spaces || 0))),
    walk_meters: Math.max(0, Number(body.walk_meters || body.walk || 0)),
    drive_minutes: Math.max(1, Number(body.drive_minutes || body.drive || 1)),
    rating: Number(body.rating || 4.1),
    amenities: {
      ev_charging: Boolean(body.amenities?.ev_charging || body.ev_charging || body.ev),
      ev_connector_type: String(body.amenities?.ev_connector_type || '').trim() || undefined,
      ev_kw: body.amenities?.ev_kw ? Number(body.amenities.ev_kw) : undefined,
      accessible: Boolean(body.amenities?.accessible || body.accessible),
      motorbike: Boolean(body.amenities?.motorbike || body.motorbike || body.bike),
      covered: Boolean(body.amenities?.covered || body.covered),
      security: body.amenities?.security == null ? true : Boolean(body.amenities.security),
      lighting: body.amenities?.lighting == null ? true : Boolean(body.amenities.lighting),
      car_wash: Boolean(body.amenities?.car_wash || body.car_wash)
    },
    owner_listed: Boolean(ownerId || body.owner_listed),
    verification_status: body.verification_status || 'pending',
    is_open: body.is_open == null ? true : Boolean(body.is_open),
    primary_photo_url: String(body.primary_photo_url || body.photo_url || ''),
    owner_notes: String(body.owner_notes || body.notes || ''),
    opening_hours: String(body.opening_hours || body.hours || '06:00–22:00')
  };
}
function missingLotFields(lot) {
  return ['name', 'area', 'address'].filter(k => !lot[k]);
}
module.exports = { normalizeAmenityKey, lotFromBody, missingLotFields };
