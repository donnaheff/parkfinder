const { ok, requireMethod, parseBody } = require('./_lib/http');
const { getClient, run, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');
const { rateLimit } = require('./_lib/ratelimit');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const client = getClient();
  if (req.method === 'GET') {
    const saved = await run(client.from('saved_parks').select('parking_lot_id').eq('user_id', user.id));
    const ids = saved.map(s => s.parking_lot_id);
    if (!ids.length) return ok(res, []);
    return ok(res, await run(client.from('parking_lots').select('*').in('id', ids)));
  }
  if (!await rateLimit(req, res, 'saved-create')) return;
  const body = await parseBody(req);
  const row = { user_id: user.id, parking_lot_id: body.parking_lot_id };
  const existing = await run(client.from('saved_parks').select('*').eq('user_id', row.user_id).eq('parking_lot_id', row.parking_lot_id).limit(1));
  if (existing[0]) return ok(res, existing[0]);
  const inserted = await run(client.from('saved_parks').insert(row).select());
  ok(res, inserted[0], 201);
}, res);
