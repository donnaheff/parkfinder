const { ok, fail, requireMethod, id: genId } = require('../../_lib/http');
const { getClient, run, one, handle } = require('../../_lib/supabase');
const { requireUser } = require('../../_lib/auth');
const { isPaymentsEnabled, initiatePayment } = require('../../_lib/payments');

function hoursBetween(startIso, endIso) {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000);
}

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;

  const reservation = await one('reservations', req.query.id);
  if (!reservation) return fail(res, 404, 'Reservation not found');
  if (reservation.user_id !== user.id) return fail(res, 403, 'Not your reservation');
  if (reservation.status !== 'held') return fail(res, 400, 'Only a held reservation can be paid for');

  const lot = await one('parking_lots', reservation.lot_id);
  const amount = Math.round((lot?.price_per_hour || 0) * hoursBetween(reservation.start_time, reservation.end_time) * 100) / 100;

  // Free lot (price_per_hour is 0/unset, the default for lots that predate
  // pricing) — skip payment entirely and confirm the hold directly, so
  // existing free listings keep working exactly as before this phase.
  if (amount <= 0) {
    const confirmed = await run(getClient().rpc('confirm_reservation', { p_reservation_id: reservation.id, p_user_id: user.id }));
    return ok(res, { reservation: confirmed, free: true });
  }

  // Phase 16: referral credit only ever pays for a reservation in full
  // (skipping Flutterwave entirely, same as the free-lot path above) —
  // never as a partial discount on a card charge. redeem_credit is
  // all-or-nothing under a row lock, so there's no way to spend credit
  // and then have the "confirm for free" step fail.
  const redeemed = await run(getClient().rpc('redeem_credit', { p_user_id: user.id, p_amount: amount }));
  if (redeemed >= amount) {
    const confirmed = await run(getClient().rpc('confirm_reservation', { p_reservation_id: reservation.id, p_user_id: user.id }));
    return ok(res, { reservation: confirmed, free: true, creditApplied: redeemed });
  }

  if (!isPaymentsEnabled()) return fail(res, 503, 'Payments are not configured yet.');

  const reference = genId('flw');
  // Call Flutterwave before touching reservation state, so a Flutterwave
  // failure never leaves the reservation stuck in 'awaiting_payment' with no
  // checkout link to show for it.
  const checkoutUrl = await initiatePayment({
    reference,
    amount,
    currency: reservation.currency || 'NGN',
    email: user.email,
    name: user.user_metadata?.full_name,
    lotName: lot?.name || 'your parking lot',
  });

  const updated = await run(
    getClient().rpc('mark_awaiting_payment', {
      p_reservation_id: reservation.id,
      p_user_id: user.id,
      p_amount: amount,
      p_currency: reservation.currency || 'NGN',
      p_reference: reference,
    })
  );

  ok(res, { reservation: updated, checkoutUrl, free: false });
}, res);
