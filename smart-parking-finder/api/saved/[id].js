const { ok, requireMethod } = require('../_lib/http');
const { rest, handle } = require('../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['DELETE'])) return;
  const userId = (new URL(req.url, 'http://localhost')).searchParams.get('user_id') || 'user_demo';
  await rest(`saved_parks?user_id=eq.${userId}&parking_lot_id=eq.${req.query.id}`, { method: 'DELETE', prefer: 'return=minimal' });
  ok(res, { removed: true });
}, res);
