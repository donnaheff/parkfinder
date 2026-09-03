const { ok, requireMethod } = require('../_lib/http');
const { handle } = require('../_lib/supabase');
const { requireUser, getOwnerForUser } = require('../_lib/auth');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  ok(res, await getOwnerForUser(user.id));
}, res);
