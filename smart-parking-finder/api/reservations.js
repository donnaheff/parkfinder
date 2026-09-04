const { ok, fail, requireMethod, parseBody } = require('./_lib/http');
const { getClient, run, one, handle } = require('./_lib/supabase');
const { requireUser } = require('./_lib/auth');
const { rateLimit } = require('./_lib/ratelimit');
const { sendReservationHoldEmail } = require('./_lib/email');
const { sendReservationHoldSms } = require('./_lib/sms');

const HOLD_MINUTES = 10;

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const user = await requireUser(req, res);
  if (!user) return;
  const client = getClient();

  if (req.method === 'GET') {
    const rows = await run(
      client.from('reservations').select('*, parking_lots(name, area, address, price_per_hour)')
        .eq('user_id', user.id).order('created_at', { ascending: false })
    );
    return ok(res, rows);
  }

  if (!await rateLimit(req, res, 'reservations-create')) return;
  const body = await parseBody(req);
  const startTime = body.start_time ? new Date(body.start_time) : new Date();
  const endTime = body.end_time ? new Date(body.end_time) : null;
  if (!body.parking_lot_id) return fail(res, 400, 'parking_lot_id is required');
  if (!endTime || Number.isNaN(endTime.getTime()) || Number.isNaN(startTime.getTime())) {
    return fail(res, 400, 'A valid end_time is required');
  }

  const reservation = await run(
    client.rpc('create_reservation_hold', {
      p_lot_id: body.parking_lot_id,
      p_user_id: user.id,
      p_start_time: startTime.toISOString(),
      p_end_time: endTime.toISOString(),
      p_hold_minutes: HOLD_MINUTES,
    })
  );

  const lot = await one('parking_lots', reservation.lot_id);
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

  ok(res, reservation, 201);
}, res);
