const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { rest, qs, handle } = require('../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const body = await parseBody(req);
  const name = String(body.name || body.contact_name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const business_name = String(body.business_name || body.owner_name || '').trim();
  if (!name || !email || !phone) return fail(res, 400, 'name, email, and phone are required');
  const existing = await rest(`owners?${qs({ select: '*', email: `eq.${email}`, limit: 1 })}`);
  if (existing[0]) return ok(res, existing[0]);
  const owner = await rest('owners', { method: 'POST', body: { name, email, phone, business_name, status: 'active' } });
  ok(res, owner[0], 201);
}, res);
