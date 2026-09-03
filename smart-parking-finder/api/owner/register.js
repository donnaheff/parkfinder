const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
const { requireUser, getOwnerForUser } = require('../_lib/auth');
const { rateLimit } = require('../_lib/ratelimit');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  if (!await rateLimit(req, res, 'owner-register')) return;
  const body = await parseBody(req);
  const name = String(body.name || body.contact_name || '').trim();
  const phone = String(body.phone || '').trim();
  const business_name = String(body.business_name || body.owner_name || '').trim();
  if (!name || !phone) return fail(res, 400, 'name and phone are required');

  const existing = await getOwnerForUser(user.id);
  if (existing) return ok(res, existing);

  // email always comes from the verified session, never the request body —
  // otherwise anyone could register an owner profile under someone else's email.
  const owner = await run(getClient().from('owners').insert({ auth_user_id: user.id, name, email: user.email, phone, business_name, status: 'active' }).select());
  ok(res, owner[0], 201);
}, res);
