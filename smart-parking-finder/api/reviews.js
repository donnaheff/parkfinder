const { ok, fail, requireMethod, parseBody } = require('./_lib/http');
const { getClient, run, one, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');
const { rateLimit } = require('./_lib/ratelimit');

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const client = getClient();

  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const lotId = url.searchParams.get('parking_lot_id');
    if (!lotId) return fail(res, 400, 'parking_lot_id is required');
    const rows = await run(
      client.from('reviews').select('*').eq('lot_id', lotId).order('created_at', { ascending: false })
    );
    return ok(res, rows);
  }

  const user = await requireUser(req, res);
  if (!user) return;
  if (!await rateLimit(req, res, 'reviews-create')) return;
  const body = await parseBody(req);
  if (!body.parking_lot_id) return fail(res, 400, 'parking_lot_id is required');
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return fail(res, 400, 'rating must be between 1 and 5');

  const lot = await one('parking_lots', body.parking_lot_id);
  if (!lot) return fail(res, 404, 'Parking lot not found');

  const row = {
    lot_id: lot.id,
    user_id: user.id,
    rating,
    comment: String(body.comment || '').slice(0, 1000),
    photo_urls: Array.isArray(body.photo_urls) ? body.photo_urls.slice(0, 6).map(String) : [],
    updated_at: new Date().toISOString(),
  };

  // One review per user per lot (unique constraint) — upsert so editing an
  // existing review is just posting again.
  const inserted = await run(
    client.from('reviews').upsert(row, { onConflict: 'lot_id,user_id' }).select()
  );
  ok(res, inserted[0], 201);
}, res);
