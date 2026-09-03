const { ok, requireMethod, parseBody, fail } = require('./_lib/http');
const { getClient, run, one, handle, dbError } = require('./_lib/supabase');
const { rateLimit } = require('./_lib/ratelimit');

// How many independent "full" reports in this window are required before we
// trust crowdsourced input enough to auto-zero a lot's availability. A single
// anonymous report used to be enough to do this, which let anyone grief a
// listing's availability with one unauthenticated POST.
const FULL_REPORT_THRESHOLD = 3;
const FULL_REPORT_WINDOW_MS = 15 * 60 * 1000;

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const client = getClient();
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const parkId = url.searchParams.get('parking_lot_id');
    let query = client.from('community_reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (parkId) query = query.eq('parking_lot_id', parkId);
    return ok(res, await run(query));
  }
  if (!await rateLimit(req, res, 'updates-create')) return;
  const body = await parseBody(req);
  const lot = await one('parking_lots', body.parking_lot_id);
  if (!lot) return fail(res, 404, 'Parking lot not found');
  const report = { parking_lot_id: lot.id, lot_name: lot.name, user_id: body.user_id || null, user_name: String(body.user_name || 'Guest').slice(0, 80), status: String(body.status || 'Available').slice(0, 40), comment: String(body.comment || '').slice(0, 500) };
  const inserted = await run(client.from('community_reports').insert(report).select());

  if (/full/i.test(report.status)) {
    const since = new Date(Date.now() - FULL_REPORT_WINDOW_MS).toISOString();
    const { count, error: countError } = await client
      .from('community_reports')
      .select('id', { count: 'exact', head: true })
      .eq('parking_lot_id', lot.id).ilike('status', '%full%').gte('created_at', since);
    if (countError) throw dbError(countError);
    if ((count || 0) >= FULL_REPORT_THRESHOLD) {
      await run(client.from('parking_lots').update({ available_spaces: 0, updated_at: new Date().toISOString() }).eq('id', lot.id));
    }
  }

  ok(res, inserted[0], 201);
}, res);
