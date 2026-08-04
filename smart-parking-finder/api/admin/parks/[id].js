const { ok, fail, requireMethod, requireAdmin, parseBody } = require('../../_lib/http');
const { rest, one, handle } = require('../../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  if (!requireAdmin(req, res)) return;
  const lot = await one('parking_lots', req.query.id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  const body = await parseBody(req);
  const allowed = ['name', 'area', 'type', 'address', 'capacity', 'available_spaces', 'walk_meters', 'drive_minutes', 'rating', 'is_open', 'primary_photo_url', 'opening_hours'];
  const update = { updated_at: new Date().toISOString() };
  for (const key of allowed) if (body[key] !== undefined) update[key] = body[key];
  if (body.amenities) update.amenities = { ...lot.amenities, ...body.amenities };
  const updated = await rest(`parking_lots?id=eq.${lot.id}`, { method: 'PATCH', body: update });
  ok(res, updated[0]);
}, res);
