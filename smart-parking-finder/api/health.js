const { ok, requireMethod } = require('./_lib/http');
module.exports = async (req, res) => {
  if (!requireMethod(req, res, ['GET'])) return;
  ok(res, { ok: true, service: 'parkswift-vercel-api', time: new Date().toISOString(), supabase: Boolean(process.env.SUPABASE_URL) });
};
