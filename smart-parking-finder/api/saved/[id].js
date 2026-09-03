const { ok, requireMethod } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
const { requireUser } = require('../_lib/auth');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['DELETE'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  await run(getClient().from('saved_parks').delete().eq('user_id', user.id).eq('parking_lot_id', req.query.id));
  ok(res, { removed: true });
}, res);
