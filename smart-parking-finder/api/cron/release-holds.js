const { ok, fail, requireMethod } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');

// Vercel Cron (see vercel.json's `crons`) hits this on a schedule to sweep
// expired reservation holds back into available_spaces. Protected by
// CRON_SECRET so it can't be triggered by anyone who finds the URL — Vercel
// sends this as a Bearer token automatically for scheduled invocations.
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail(res, 500, 'Server misconfigured: CRON_SECRET is not set');
  if (req.headers['authorization'] !== `Bearer ${secret}`) return fail(res, 401, 'Unauthorized');

  const released = await run(getClient().rpc('release_expired_holds'));
  ok(res, { released });
}, res);
