const { ok, fail, requireMethod, requireAdmin, parseBody } = require('../../../_lib/http');
const { rest, one, handle } = require('../../../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  if (!requireAdmin(req, res)) return;
  const lot = await one('parking_lots', req.query.id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  const body = await parseBody(req);
  const statusMap = { 'approve': 'verified', 'reject': 'rejected', 'request-info': 'more_info_requested' };
  const action = 'approve';
  const updated = await rest(`parking_lots?id=eq.${lot.id}`, { method: 'PATCH', body: { verification_status: statusMap[action], updated_at: new Date().toISOString() } });
  await rest('admin_actions', { method: 'POST', body: { admin_id: 'admin', target_type: 'parking_lot', target_id: lot.id, action, notes: String(body.notes || '') } });
  ok(res, updated[0]);
}, res);
