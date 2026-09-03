const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
const { rateLimit } = require('../_lib/ratelimit');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  if (!await rateLimit(req, res, 'owner-register')) return;
  const body = await parseBody(req);
  const name = String(body.name || body.contact_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const business_name = String(body.business_name || body.owner_name || '').trim();
  if (!name || !email || !phone) return fail(res, 400, 'name, email, and phone are required');
  const client = getClient();
  const existing = await run(client.from('owners').select('*').eq('email', email).limit(1));
  if (existing[0]) return ok(res, existing[0]);
  const owner = await run(client.from('owners').insert({ name, email, phone, business_name, status: 'active' }).select());
  ok(res, owner[0], 201);
}, res);
