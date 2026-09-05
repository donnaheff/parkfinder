const { ok, requireMethod } = require('./_lib/http');
const { getClient, run, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');

// Read-only: rows here are only ever created by api/webhooks/flutterwave.js
// after a verified charge with the payer's opt-in, never by the client
// directly — see supabase/schema.sql's RLS policies on payment_methods
// (select+delete only, no insert/update).
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const rows = await run(getClient().from('payment_methods').select('*').eq('user_id', user.id).order('created_at', { ascending: false }));
  ok(res, rows);
}, res);
