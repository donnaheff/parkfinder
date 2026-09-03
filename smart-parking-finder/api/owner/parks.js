const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
const { requireOwner } = require('../_lib/auth');
const { lotFromBody, missingLotFields } = require('../_lib/parking');
const { rateLimit } = require('../_lib/ratelimit');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const client = getClient();
  const owner = await requireOwner(req, res);
  if (!owner) return;

  if (req.method === 'GET') {
    return ok(res, await run(client.from('parking_lots').select('*').eq('owner_id', owner.id).order('created_at', { ascending: false })));
  }

  if (!await rateLimit(req, res, 'owner-parks-create')) return;
  const body = await parseBody(req);
  const lot = lotFromBody(body, owner.id);
  const missing = missingLotFields(lot);
  if (missing.length) return fail(res, 400, `Missing required fields: ${missing.join(', ')}`);
  const inserted = await run(client.from('parking_lots').insert(lot).select());
  await run(client.from('admin_actions').insert({ target_type: 'parking_lot', target_id: inserted[0].id, action: 'owner_submitted', notes: `Submitted by ${owner.email}` }));
  ok(res, inserted[0], 201);
}, res);
