const { ok, requireMethod, requireAdmin } = require('../_lib/http');
const { rest, handle } = require('../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  if (!requireAdmin(req, res)) return;
  const rows = await rest('parking_lots?select=*&owner_listed=eq.true&verification_status=neq.verified&order=created_at.desc');
  ok(res, rows);
}, res);
