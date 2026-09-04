const { ok, requireMethod } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
const { requireAdminUser } = require('../_lib/auth');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const admin = await requireAdminUser(req, res);
  if (!admin) return;
  const rows = await run(
    getClient().from('reviews').select('*, parking_lots(name)')
      .gt('report_count', 0).order('report_count', { ascending: false })
  );
  ok(res, rows);
}, res);
