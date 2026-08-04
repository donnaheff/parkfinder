const { ok, requireMethod, parseBody } = require('./_lib/http');
const { rest, qs, handle } = require('./_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('user_id') || 'user_demo';
    const saved = await rest(`saved_parks?${qs({ select: 'parking_lot_id', user_id: `eq.${userId}` })}`);
    const ids = saved.map(s => s.parking_lot_id);
    if (!ids.length) return ok(res, []);
    return ok(res, await rest(`parking_lots?select=*&id=in.(${ids.join(',')})`));
  }
  const body = await parseBody(req);
  const row = { user_id: body.user_id || 'user_demo', parking_lot_id: body.parking_lot_id };
  const existing = await rest(`saved_parks?${qs({ select: '*', user_id: `eq.${row.user_id}`, parking_lot_id: `eq.${row.parking_lot_id}`, limit: 1 })}`);
  if (existing[0]) return ok(res, existing[0]);
  const inserted = await rest('saved_parks', { method: 'POST', body: row });
  ok(res, inserted[0], 201);
}, res);
