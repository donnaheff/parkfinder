const { ok, fail, requireMethod, parseBody } = require('../../../_lib/http');
const { rest, one, handle } = require('../../../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  const lot = await one('parking_lots', req.query.id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  const body = await parseBody(req);
  const available_spaces = Math.max(0, Math.min(lot.capacity, Number(body.available_spaces)));
  const updated = await rest(`parking_lots?id=eq.${lot.id}`, { method: 'PATCH', body: { available_spaces, updated_at: new Date().toISOString() } });
  ok(res, updated[0]);
}, res);
