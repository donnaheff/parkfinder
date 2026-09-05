const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { getClient, run, one, handle } = require('../_lib/supabase');
const { requireUser } = require('../_lib/auth');

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH', 'DELETE'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const client = getClient();

  const vehicle = await one('vehicles', req.query.id);
  if (!vehicle || vehicle.user_id !== user.id) return fail(res, 404, 'Vehicle not found');

  if (req.method === 'DELETE') {
    await run(client.from('vehicles').delete().eq('id', vehicle.id));
    return ok(res, { removed: true });
  }

  const body = await parseBody(req);
  if (body.is_default) {
    // Only one default vehicle per user — clear the others first.
    await run(client.from('vehicles').update({ is_default: false }).eq('user_id', user.id));
  }
  const updated = await run(
    client.from('vehicles').update({ is_default: Boolean(body.is_default) }).eq('id', vehicle.id).select()
  );
  ok(res, updated[0]);
}, res);
