let resendClient;
let warned = false;

// Lazily builds a Resend client. Returns null when RESEND_API_KEY isn't
// configured (e.g. local dev, or before a deployment sets it up) so callers
// can no-op instead of failing the request they're attached to —
// notification email is additive, never something a booking/moderation
// action should fail over.
function getResend() {
  if (resendClient !== undefined) return resendClient;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (!warned) { console.warn('[email] RESEND_API_KEY not set — notification emails are disabled.'); warned = true; }
    resendClient = null;
    return resendClient;
  }
  const { Resend } = require('resend');
  resendClient = new Resend(key);
  return resendClient;
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'ParkSwift <notifications@parkswift.example>';

async function sendEmail({ to, subject, html }) {
  const resend = getResend();
  if (!resend || !to) return { skipped: true };
  try {
    return await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
  } catch (err) {
    console.error('[email] send failed:', err.message);
    return { skipped: true, error: err.message };
  }
}

function fmt(dateStr) {
  return new Date(dateStr).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

async function sendReservationHoldEmail({ to, lotName, startTime, endTime, holdExpiresAt }) {
  return sendEmail({
    to,
    subject: `Your parking hold at ${lotName}`,
    html: `<p>We've held a space for you at <strong>${lotName}</strong>, from ${fmt(startTime)} to ${fmt(endTime)}.</p>
<p>This hold expires at <strong>${fmt(holdExpiresAt)}</strong> unless you confirm it in the app — visit
<a href="https://parkswift.example/reservations">My Reservations</a> to confirm or cancel.</p>`,
  });
}

const DECISION_TEXT = { approve: 'approved and is now live', reject: 'rejected', 'request-info': 'sent back — we need more information' };

async function sendAdminDecisionEmail({ to, lotName, decision, notes }) {
  return sendEmail({
    to,
    subject: `Update on your listing: ${lotName}`,
    html: `<p>Your parking lot listing <strong>${lotName}</strong> has been <strong>${DECISION_TEXT[decision] || decision}</strong>.</p>
${notes ? `<p>Notes from the reviewer: ${notes}</p>` : ''}`,
  });
}

module.exports = { sendEmail, sendReservationHoldEmail, sendAdminDecisionEmail };
