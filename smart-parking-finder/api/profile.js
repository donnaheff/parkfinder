const { ok, requireMethod, parseBody } = require('./_lib/http');
const { getClient, run, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const client = getClient();

  if (req.method === 'GET') {
    const rows = await run(client.from('profiles').select('*').eq('user_id', user.id).limit(1));
    return ok(res, rows[0] || null);
  }

  const body = await parseBody(req);
  const row = await run(
    client.from('profiles')
      .upsert({ user_id: user.id, phone: String(body.phone || '').trim(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select().single()
  );
  ok(res, row);
}, res);
