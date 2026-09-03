const { ok, requireMethod } = require('./_lib/http');
const { getClient, run, handle } = require('./_lib/supabase');
const { requireAdminUser } = require('./_lib/auth');
const seedLots = [
  { name: 'Civic Centre Garage', area: 'Victoria Island', type: 'Multi-storey garage', address: 'Ozumba Mbadiwe corridor', latitude: 6.4281, longitude: 3.4219, map_x: 83, map_y: 23, capacity: 80, available_spaces: 42, walk_meters: 240, drive_minutes: 5, rating: 4.8, amenities: { ev_charging: true, accessible: true, motorbike: true, covered: true, security: true, lighting: true }, owner_listed: false, verification_status: 'verified', is_open: true },
  { name: 'Marina Multi-Storey', area: 'Lagos Island', type: 'Multi-storey garage', address: 'Marina district', latitude: 6.4541, longitude: 3.3947, map_x: 58, map_y: 52, capacity: 65, available_spaces: 17, walk_meters: 420, drive_minutes: 8, rating: 4.5, amenities: { ev_charging: false, accessible: true, motorbike: true, covered: true, security: true, lighting: true }, owner_listed: false, verification_status: 'verified', is_open: true },
  { name: 'Lekki Link Lot', area: 'Lekki Phase 1', type: 'Open car park', address: 'Admiralty Road area', latitude: 6.4474, longitude: 3.4723, map_x: 71, map_y: 67, capacity: 48, available_spaces: 6, walk_meters: 680, drive_minutes: 11, rating: 4.2, amenities: { ev_charging: true, accessible: false, motorbike: true, covered: false, security: true, lighting: true }, owner_listed: false, verification_status: 'verified', is_open: true },
  { name: 'Adeniji Central Park', area: 'Ikoyi', type: 'Open car park', address: 'Ikoyi central', latitude: 6.4557, longitude: 3.4329, map_x: 36, map_y: 37, capacity: 55, available_spaces: 31, walk_meters: 320, drive_minutes: 7, rating: 4.6, amenities: { ev_charging: true, accessible: true, motorbike: false, covered: false, security: true, lighting: true }, owner_listed: false, verification_status: 'verified', is_open: true },
  { name: 'Eko Atlantic Bay A', area: 'Eko Atlantic', type: 'Underground garage', address: 'Eko Atlantic boulevard', latitude: 6.4101, longitude: 3.4087, map_x: 24, map_y: 74, capacity: 90, available_spaces: 0, walk_meters: 150, drive_minutes: 9, rating: 4.7, amenities: { ev_charging: true, accessible: true, motorbike: true, covered: true, security: true, lighting: true }, owner_listed: false, verification_status: 'verified', is_open: true },
  { name: 'Yaba Tech Hub Park', area: 'Yaba', type: 'Office parking', address: 'Herbert Macaulay corridor', latitude: 6.5179, longitude: 3.3869, map_x: 48, map_y: 19, capacity: 40, available_spaces: 24, walk_meters: 760, drive_minutes: 14, rating: 4.3, amenities: { ev_charging: false, accessible: false, motorbike: true, covered: false, security: true, lighting: true }, owner_listed: false, verification_status: 'verified', is_open: true }
];
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  if (!await requireAdminUser(req, res)) return;
  const inserted = await run(getClient().from('parking_lots').insert(seedLots).select());
  ok(res, { inserted: inserted.length, data: inserted }, 201);
}, res);
