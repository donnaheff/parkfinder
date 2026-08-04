const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { rest, qs, one, handle } = require('../_lib/supabase');
const { lotFromBody, missingLotFields } = require('../_lib/parking');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  if (req.method === 'GET') {
    const url = new URL(req.url, 'http://localhost');
    const ownerId = url.searchParams.get('owner_id');
    const params = { select: '*' };
    if (ownerId) params.owner_id = `eq.${ownerId}`;
    return ok(res, await rest(`parking_lots?${qs(params)}&order=created_at.desc`));
  }
  const body = await parseBody(req);
  const owner = await one('owners', body.owner_id);
  if (!owner) return fail(res, 400, 'owner_id not found. Register owner first.');
  const lot = lotFromBody(body, owner.id);
  const missing = missingLotFields(lot);
  if (missing.length) return fail(res, 400, `Missing required fields: ${missing.join(', ')}`);
  const inserted = await rest('parking_lots', { method: 'POST', body: lot });
  await rest('admin_actions', { method: 'POST', body: { target_type: 'parking_lot', target_id: inserted[0].id, action: 'owner_submitted', notes: `Submitted by ${owner.email}` } });
  ok(res, inserted[0], 201);
}, res);
