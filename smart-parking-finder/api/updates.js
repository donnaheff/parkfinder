const { ok, requireMethod, parseBody, fail } = require('./_lib/http');
const { rest, qs, one, handle } = require('./_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const parkId = url.searchParams.get('parking_lot_id');
    const params = { select: '*', order: 'created_at.desc', limit: 100 };
    if (parkId) params.parking_lot_id = `eq.${parkId}`;
    return ok(res, await rest(`community_reports?${qs(params)}`));
  }
  const body = await parseBody(req);
  const lot = await one('parking_lots', body.parking_lot_id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  const report = { parking_lot_id: lot.id, lot_name: lot.name, user_id: body.user_id || null, user_name: String(body.user_name || 'Guest'), status: String(body.status || 'Available'), comment: String(body.comment || '') };
  const inserted = await rest('community_reports', { method: 'POST', body: report });
  if (/full/i.test(report.status)) await rest(`parking_lots?id=eq.${lot.id}`, { method: 'PATCH', body: { available_spaces: 0, updated_at: new Date().toISOString() } });
  ok(res, inserted[0], 201);
}, res);
