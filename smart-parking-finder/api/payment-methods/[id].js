const { ok, fail, requireMethod } = require('../_lib/http');
const { getClient, run, one, handle } = require('../_lib/supabase');
const { requireUser } = require('../_lib/auth');

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['DELETE'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const method = await one('payment_methods', req.query.id);
  if (!method || method.user_id !== user.id) return fail(res, 404, 'Payment method not found');
  await run(getClient().from('payment_methods').delete().eq('id', method.id));
  ok(res, { removed: true });
}, res);
