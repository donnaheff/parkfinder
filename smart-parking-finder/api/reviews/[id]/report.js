const { ok, requireMethod } = require('../../_lib/http');
const { getClient, run, handle } = require('../../_lib/supabase');
const { requireUser } = require('../../_lib/auth');
const { rateLimit } = require('../../_lib/ratelimit');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  if (!await rateLimit(req, res, 'reviews-report')) return;
  const review = await run(getClient().rpc('report_review', { p_review_id: req.query.id }));
  ok(res, review);
}, res);
