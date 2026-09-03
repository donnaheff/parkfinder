const { ok, fail, requireMethod, parseBody } = require('../../../_lib/http');
const { getClient, run, one, handle } = require('../../../_lib/supabase');
const { requireOwner } = require('../../../_lib/auth');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const lot = await one('parking_lots', req.query.id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  if (lot.owner_id !== owner.id) return fail(res, 403, 'Not your listing');
  const body = await parseBody(req);
  const updated = await run(getClient().from('parking_lots').update({ is_open: Boolean(body.is_open), updated_at: new Date().toISOString() }).eq('id', lot.id).select());
  ok(res, updated[0]);
}, res);
