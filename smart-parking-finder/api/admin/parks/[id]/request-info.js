const { ok, fail, requireMethod, requireAdmin, parseBody } = require('../../../_lib/http');
const { getClient, run, one, handle } = require('../../../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  if (!requireAdmin(req, res)) return;
  const lot = await one('parking_lots', req.query.id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  const body = await parseBody(req);
  const client = getClient();
  const updated = await run(client.from('parking_lots').update({ verification_status: 'more_info_requested', updated_at: new Date().toISOString() }).eq('id', lot.id).select());
  await run(client.from('admin_actions').insert({ admin_id: 'admin', target_type: 'parking_lot', target_id: lot.id, action: 'request-info', notes: String(body.notes || '') }));
  ok(res, updated[0]);
}, res);
