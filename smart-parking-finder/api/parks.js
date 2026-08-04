const { ok, requireMethod, fail } = require('./_lib/http');
const { rest, qs, handle } = require('./_lib/supabase');
const { normalizeAmenityKey } = require('./_lib/parking');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const url = new URL(req.url, 'http://localhost');
  const params = { select: '*' };
  const q = url.searchParams.get('q');
  const area = url.searchParams.get('area');
  const amenity = normalizeAmenityKey(url.searchParams.get('amenity') || '');
  const available = url.searchParams.get('available');
  const ownerListed = url.searchParams.get('ownerListed');
  const status = url.searchParams.get('status');
  if (q) params.or = `(name.ilike.*${q}*,area.ilike.*${q}*,address.ilike.*${q}*,type.ilike.*${q}*)`;
  if (area) params.area = `ilike.*${area}*`;
  if (available === 'true') { params.is_open = 'eq.true'; params.available_spaces = 'gt.0'; }
  if (ownerListed === 'true') params.owner_listed = 'eq.true';
  if (status) params.verification_status = `eq.${status}`;
  const rows = await rest(`parking_lots?${qs(params)}&order=available_spaces.desc`);
  const filtered = amenity ? rows.filter(row => row.amenities && row.amenities[amenity]) : rows;
  ok(res, filtered);
}, res);
