const { ok, requireMethod } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['DELETE'])) return;
  const userId = (new URL(req.url, 'http://localhost')).searchParams.get('user_id') || 'user_demo';
  await run(getClient().from('saved_parks').delete().eq('user_id', userId).eq('parking_lot_id', req.query.id));
  ok(res, { removed: true });
}, res);
