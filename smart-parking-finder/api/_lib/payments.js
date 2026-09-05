let warned = false;

// Returns the Flutterwave secret key, or null if payments aren't configured
// (e.g. local dev, or before a deployment sets it up) so callers can fail
// with a clear "not configured" error rather than crashing on a missing key.
function getSecretKey() {
  const key = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key && !warned) {
    console.warn('[payments] FLUTTERWAVE_SECRET_KEY not set — payments are disabled.');
    warned = true;
  }
  return key || null;
}

function isPaymentsEnabled() {
  return Boolean(process.env.FLUTTERWAVE_SECRET_KEY);
}

const FLW_BASE = 'https://api.flutterwave.com/v3';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://parkswift.example';

// Initiates a Flutterwave Standard checkout for a reservation already moved
// to 'awaiting_payment' (see mark_awaiting_payment in supabase/schema.sql).
// Returns the hosted checkout URL to redirect the browser to.
async function initiatePayment({ reference, amount, currency, email, name, lotName }) {
  const key = getSecretKey();
  if (!key) throw new Error('Payments are not configured yet.');

  const res = await fetch(`${FLW_BASE}/payments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx_ref: reference,
      amount,
      currency,
      redirect_url: `${APP_BASE_URL}/reservations`,
      customer: { email, name: name || email },
      customizations: { title: 'ParkSwift', description: `Parking hold at ${lotName}` },
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== 'success' || !json.data?.link) {
    throw new Error(json.message || 'Failed to start payment with Flutterwave');
  }
  return json.data.link;
}

// Independently re-verifies a transaction against Flutterwave's API by its
// transaction id. Never trust a webhook payload's own claimed status/amount
// for a financial decision — always confirm against this endpoint first.
async function verifyTransaction(transactionId) {
  const key = getSecretKey();
  if (!key) throw new Error('Payments are not configured yet.');

  const res = await fetch(`${FLW_BASE}/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== 'success' || !json.data) {
    throw new Error(json.message || 'Failed to verify transaction with Flutterwave');
  }
  return json.data; // { status, amount, currency, tx_ref, id, ... }
}

// Constant-time-ish comparison isn't needed here: Flutterwave's webhook auth
// is a shared static secret hash sent verbatim (not an HMAC signature), so
// this is a plain equality check against FLUTTERWAVE_SECRET_HASH.
function isValidWebhookSignature(req) {
  const expected = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!expected) return false;
  const provided = req.headers['verif-hash'];
  return typeof provided === 'string' && provided === expected;
}

module.exports = { isPaymentsEnabled, initiatePayment, verifyTransaction, isValidWebhookSignature };
