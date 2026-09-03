const { ok, fail, requireMethod } = require('../_lib/http');
const { getClient, run, one, handle } = require('../_lib/supabase');
const { requireUser } = require('../_lib/auth');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['DELETE'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const review = await one('reviews', req.query.id);
  if (!review) return fail(res, 404, 'Review not found');
  if (review.user_id !== user.id) return fail(res, 403, 'Not your review');
  await run(getClient().from('reviews').delete().eq('id', review.id));
  ok(res, { removed: true });
}, res);
