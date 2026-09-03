const { ok, requireMethod, requireAdmin } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  if (!requireAdmin(req, res)) return;
  const rows = await run(
    getClient().from('parking_lots').select('*')
      .eq('owner_listed', true).neq('verification_status', 'verified')
      .order('created_at', { ascending: false })
  );
  ok(res, rows);
}, res);
