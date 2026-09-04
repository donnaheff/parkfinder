const { ok, requireMethod } = require('./_lib/http');
const { getClient, run, escapeFilterValue, handle } = require('./_lib/supabase');
const { normalizeAmenityKey } = require('./_lib/parking');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q');
  const area = url.searchParams.get('area');
  const city = url.searchParams.get('city');
  const amenity = normalizeAmenityKey(url.searchParams.get('amenity') || '');
  const available = url.searchParams.get('available');
  const ownerListed = url.searchParams.get('ownerListed');
  const status = url.searchParams.get('status');
  const priceMax = url.searchParams.get('price_max');
  const heightMin = url.searchParams.get('height_min');
  const is24_7 = url.searchParams.get('is_24_7');

  let query = getClient().from('parking_lots').select('*').order('available_spaces', { ascending: false });
  if (q) {
    const v = escapeFilterValue(q).slice(0, 120);
    query = query.or(`name.ilike.*${v}*,area.ilike.*${v}*,city.ilike.*${v}*,address.ilike.*${v}*,type.ilike.*${v}*`);
  }
  if (area) query = query.ilike('area', `*${escapeFilterValue(area).slice(0, 120)}*`);
  if (city) query = query.ilike('city', `*${escapeFilterValue(city).slice(0, 120)}*`);
  if (available === 'true') query = query.eq('is_open', true).gt('available_spaces', 0);
  if (ownerListed === 'true') query = query.eq('owner_listed', true);
  if (status) query = query.eq('verification_status', status);
  if (priceMax) query = query.lte('price_per_hour', Number(priceMax));
  // A vehicle needs clearance >= its height, so a lot with no clearance
  // recorded can't be confirmed to fit — excluded rather than assumed fine.
  if (heightMin) query = query.gte('height_clearance_m', Number(heightMin));
  if (is24_7 === 'true') query = query.eq('is_24_7', true);

  const rows = await run(query);
  const filtered = amenity ? rows.filter(row => row.amenities && row.amenities[amenity]) : rows;
  ok(res, filtered);
}, res);
