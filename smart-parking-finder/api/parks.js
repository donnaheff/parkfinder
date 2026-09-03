const { ok, requireMethod } = require('./_lib/http');
const { getClient, run, escapeFilterValue, handle } = require('./_lib/supabase');
const { normalizeAmenityKey } = require('./_lib/parking');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const url = new URL(req.url, 'http://localhost');
  const q = url.searchParams.get('q');
  const area = url.searchParams.get('area');
  const amenity = normalizeAmenityKey(url.searchParams.get('amenity') || '');
  const available = url.searchParams.get('available');
  const ownerListed = url.searchParams.get('ownerListed');
  const status = url.searchParams.get('status');

  let query = getClient().from('parking_lots').select('*').order('available_spaces', { ascending: false });
  if (q) {
    const v = escapeFilterValue(q).slice(0, 120);
    query = query.or(`name.ilike.*${v}*,area.ilike.*${v}*,address.ilike.*${v}*,type.ilike.*${v}*`);
  }
  if (area) query = query.ilike('area', `*${escapeFilterValue(area).slice(0, 120)}*`);
  if (available === 'true') query = query.eq('is_open', true).gt('available_spaces', 0);
  if (ownerListed === 'true') query = query.eq('owner_listed', true);
  if (status) query = query.eq('verification_status', status);

  const rows = await run(query);
  const filtered = amenity ? rows.filter(row => row.amenities && row.amenities[amenity]) : rows;
  ok(res, filtered);
}, res);
