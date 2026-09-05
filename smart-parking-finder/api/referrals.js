const { ok, fail, requireMethod, parseBody } = require('./_lib/http');
const { getClient, run, one, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');

// Records a pending referral for the caller (the referee) against whoever
// owns the given referral_code. No credit happens here — that's applied by
// api/webhooks/flutterwave.js on the referee's first successful payment.
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const body = await parseBody(req);
  const code = String(body.referral_code || '').trim();
  if (!code) return fail(res, 400, 'referral_code is required');

  const client = getClient();
  const referrerProfile = await one('profiles', code, 'referral_code');
  if (!referrerProfile) return fail(res, 404, 'Referral code not found');
  if (referrerProfile.user_id === user.id) return fail(res, 400, "You can't refer yourself");

  const existing = await one('referrals', user.id, 'referee_user_id');
  if (existing) return fail(res, 409, 'A referral is already recorded for this account');

  const inserted = await run(
    client.from('referrals').insert({ referrer_user_id: referrerProfile.user_id, referee_user_id: user.id }).select()
  );
  ok(res, inserted[0], 201);
}, res);
