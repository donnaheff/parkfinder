const { ok, requireMethod } = require('../../_lib/http');
const { getClient, run, handle } = require('../../_lib/supabase');
const { requireUser } = require('../../_lib/auth');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const reservation = await run(
    getClient().rpc('release_reservation', { p_reservation_id: req.query.id, p_user_id: user.id })
  );
  ok(res, reservation);
}, res);
