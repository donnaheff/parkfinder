const { ok, fail, requireMethod, parseBody, id: genId } = require('./_lib/http');
const { getClient, run, one, handle } = require('./_lib/supabase');
const { getAuthedUser, requireUser } = require('./_lib/auth');
const { rateLimit } = require('./_lib/ratelimit');
const { sendReservationHoldEmail, sendGuestReservationEmail } = require('./_lib/email');
const { sendReservationHoldSms, sendGuestReservationSms } = require('./_lib/sms');
const { isPaymentsEnabled, initiatePayment } = require('./_lib/payments');

const HOLD_MINUTES = 10;
const EMAIL_RE = /\S+@\S+\.\S+/;

function hoursBetween(startIso, endIso) {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 3_600_000);
}

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const client = getClient();

  if (req.method === 'GET') {
    // No secure way to list a guest's reservations without an account (no
    // token/magic-link system) — guest checkout is confirmed by
    // email/SMS receipt only, never via this endpoint.
    const user = await requireUser(req, res);
    if (!user) return;
    const rows = await run(
      client.from('reservations').select('*, parking_lots(name, area, address, price_per_hour)')
        .eq('user_id', user.id).order('created_at', { ascending: false })
    );
    return ok(res, rows);
  }

  // POST: signed-in users get the usual hold-then-confirm/pay flow (via
  // /api/reservations/:id/confirm and /:id/pay). Guest checkout has no
  // session to come back with, so it resolves fully in this one request:
  // free lots confirm immediately, priced lots get a checkout link back
  // right away instead of a separate /pay call.
  const user = await getAuthedUser(req);
  if (!await rateLimit(req, res, 'reservations-create')) return;
  const body = await parseBody(req);
  const startTime = body.start_time ? new Date(body.start_time) : new Date();
  const endTime = body.end_time ? new Date(body.end_time) : null;
  if (!body.parking_lot_id) return fail(res, 400, 'parking_lot_id is required');
  if (!endTime || Number.isNaN(endTime.getTime()) || Number.isNaN(startTime.getTime())) {
    return fail(res, 400, 'A valid end_time is required');
  }
  if (startTime.getTime() < Date.now() - 60_000) {
    return fail(res, 400, 'start_time cannot be in the past');
  }

  const guestEmail = String(body.guest_email || '').trim();
  if (!user && !EMAIL_RE.test(guestEmail)) {
    return fail(res, 400, 'Sign in, or provide a valid guest_email to reserve without an account.');
  }

  const reservation = await run(
    client.rpc('create_reservation_hold', {
      p_lot_id: body.parking_lot_id,
      p_user_id: user?.id || null,
      p_start_time: startTime.toISOString(),
      p_end_time: endTime.toISOString(),
      p_hold_minutes: HOLD_MINUTES,
      p_guest_name: user ? null : String(body.guest_name || '').trim() || null,
      p_guest_email: user ? null : guestEmail,
      p_guest_phone: user ? null : String(body.guest_phone || '').trim() || null,
      p_vehicle_id: user ? body.vehicle_id || null : null,
    })
  );
  const lot = await one('parking_lots', reservation.lot_id);

  if (user) {
    if (user.email) {
      await sendReservationHoldEmail({
        to: user.email,
        lotName: lot?.name || 'your parking lot',
        startTime: reservation.start_time,
        endTime: reservation.end_time,
        holdExpiresAt: reservation.hold_expires_at,
      });
    }
    const profileRows = await run(client.from('profiles').select('phone').eq('user_id', user.id).limit(1));
    if (profileRows[0]?.phone) {
      await sendReservationHoldSms({
        to: profileRows[0].phone,
        lotName: lot?.name || 'your parking lot',
        holdExpiresAt: reservation.hold_expires_at,
      });
    }
    return ok(res, { reservation, checkoutUrl: null, guest: false }, 201);
  }

  // Guest path: resolve immediately, free or paid.
  const amount = Math.round((lot?.price_per_hour || 0) * hoursBetween(reservation.start_time, reservation.end_time) * 100) / 100;
  let finalReservation = reservation;
  let checkoutUrl = null;

  if (amount <= 0) {
    finalReservation = await run(client.rpc('confirm_reservation', { p_reservation_id: reservation.id, p_user_id: null }));
  } else if (!isPaymentsEnabled()) {
    return fail(res, 503, 'Payments are not configured yet.');
  } else {
    const reference = genId('flw');
    checkoutUrl = await initiatePayment({
      reference,
      amount,
      currency: 'NGN',
      email: guestEmail,
      name: body.guest_name || guestEmail,
      lotName: lot?.name || 'your parking lot',
    });
    finalReservation = await run(
      client.rpc('mark_awaiting_payment', {
        p_reservation_id: reservation.id,
        p_user_id: null,
        p_amount: amount,
        p_currency: 'NGN',
        p_reference: reference,
      })
    );
  }

  await sendGuestReservationEmail({
    to: guestEmail,
    lotName: lot?.name || 'your parking lot',
    startTime: finalReservation.start_time,
    endTime: finalReservation.end_time,
    confirmed: amount <= 0,
    checkoutUrl,
  });
  if (body.guest_phone) {
    await sendGuestReservationSms({ to: body.guest_phone, lotName: lot?.name || 'your parking lot', confirmed: amount <= 0, checkoutUrl });
  }

  ok(res, { reservation: finalReservation, checkoutUrl, guest: true }, 201);
}, res);
