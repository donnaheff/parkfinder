const { ok, fail, requireMethod } = require('../../_lib/http');
const { getClient, run, one, handle } = require('../../_lib/supabase');
const { requireUser } = require('../../_lib/auth');
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['PATCH'])) return;
  const user = await requireUser(req, res);
  if (!user) return;

  const reservation = await one('reservations', req.query.id);
  if (!reservation) return fail(res, 404, 'Reservation not found');
  const lot = await one('parking_lots', reservation.lot_id);
  if (lot?.price_per_hour > 0) {
    return fail(res, 400, 'This lot requires payment — use Pay now to confirm.');
  }

  const confirmed = await run(
    getClient().rpc('confirm_reservation', { p_reservation_id: req.query.id, p_user_id: user.id })
  );
  ok(res, confirmed);
}, res);
