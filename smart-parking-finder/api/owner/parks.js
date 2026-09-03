const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { getClient, run, one, handle } = require('../_lib/supabase');
const { lotFromBody, missingLotFields } = require('../_lib/parking');
const { rateLimit } = require('../_lib/ratelimit');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const client = getClient();
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const ownerId = url.searchParams.get('owner_id');
    let query = client.from('parking_lots').select('*').order('created_at', { ascending: false });
    if (ownerId) query = query.eq('owner_id', ownerId);
    return ok(res, await run(query));
  }
  if (!await rateLimit(req, res, 'owner-parks-create')) return;
  const body = await parseBody(req);
  const owner = await one('owners', body.owner_id);
  if (!owner) return fail(res, 400, 'owner_id not found. Register owner first.');
  const lot = lotFromBody(body, owner.id);
  const missing = missingLotFields(lot);
  if (missing.length) return fail(res, 400, `Missing required fields: ${missing.join(', ')}`);
  const inserted = await run(client.from('parking_lots').insert(lot).select());
  await run(client.from('admin_actions').insert({ target_type: 'parking_lot', target_id: inserted[0].id, action: 'owner_submitted', notes: `Submitted by ${owner.email}` }));
  ok(res, inserted[0], 201);
}, res);
