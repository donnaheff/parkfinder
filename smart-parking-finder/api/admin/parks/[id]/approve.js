const { ok, fail, requireMethod, parseBody } = require('../../../_lib/http');
const { getClient, run, one, handle } = require('../../../_lib/supabase');
const { requireAdminUser } = require('../../../_lib/auth');
const { sendAdminDecisionEmail } = require('../../../_lib/email');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  const admin = await requireAdminUser(req, res);
  if (!admin) return;
  const lot = await one('parking_lots', req.query.id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  const body = await parseBody(req);
  const notes = String(body.notes || '');
  const client = getClient();
  const updated = await run(client.from('parking_lots').update({ verification_status: 'verified', updated_at: new Date().toISOString() }).eq('id', lot.id).select());
  await run(client.from('admin_actions').insert({ admin_id: admin.id, target_type: 'parking_lot', target_id: lot.id, action: 'approve', notes }));
  const owner = lot.owner_id ? await one('owners', lot.owner_id) : null;
  if (owner?.email) await sendAdminDecisionEmail({ to: owner.email, lotName: lot.name, decision: 'approve', notes });
  ok(res, updated[0]);
}, res);
