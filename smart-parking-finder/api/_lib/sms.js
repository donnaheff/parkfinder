let twilioClient;
let warned = false;

// Lazily builds a Twilio client. Returns null when the Twilio env vars
// aren't configured so callers can no-op instead of failing the request
// they're attached to — SMS is additive, never something a booking/admin
// action should fail over. Mirrors api/_lib/email.js's pattern.
function getTwilioClient() {
  if (twilioClient !== undefined) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !process.env.TWILIO_FROM_NUMBER) {
    if (!warned) { console.warn('[sms] TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER not fully set — SMS alerts are disabled.'); warned = true; }
    twilioClient = null;
    return twilioClient;
  }
  const twilio = require('twilio');
  twilioClient = twilio(sid, token);
  return twilioClient;
}

const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

async function sendSms({ to, body }) {
  const client = getTwilioClient();
  if (!client || !to) return { skipped: true };
  try {
    return await client.messages.create({ to, from: FROM_NUMBER, body });
  } catch (err) {
    console.error('[sms] send failed:', err.message);
    return { skipped: true, error: err.message };
  }
}

async function sendReservationHoldSms({ to, lotName, holdExpiresAt }) {
  const mins = Math.max(1, Math.round((new Date(holdExpiresAt).getTime() - Date.now()) / 60000));
  return sendSms({ to, body: `ParkSwift: space held at ${lotName}. Confirm within ${mins} min or it releases. Open My Reservations to confirm/pay.` });
}

const DECISION_TEXT = { approve: 'approved and is now live', reject: 'rejected', 'request-info': 'sent back — more info needed' };

async function sendAdminDecisionSms({ to, lotName, decision }) {
  return sendSms({ to, body: `ParkSwift: your listing "${lotName}" was ${DECISION_TEXT[decision] || decision}.` });
}

async function sendGuestReservationSms({ to, lotName, confirmed, checkoutUrl }) {
  return sendSms({
    to,
    body: confirmed
      ? `ParkSwift: your space at ${lotName} is confirmed.`
      : `ParkSwift: complete payment to confirm your space at ${lotName}: ${checkoutUrl}`,
  });
}

module.exports = { sendSms, sendReservationHoldSms, sendAdminDecisionSms, sendGuestReservationSms };
