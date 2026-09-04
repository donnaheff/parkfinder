const { ok, fail, requireMethod, parseBody } = require('../_lib/http');
const { getClient, run, one, handle } = require('../_lib/supabase');
const { isValidWebhookSignature, verifyTransaction } = require('../_lib/payments');

// Flutterwave webhook: notifies us a transaction completed (success or
// failed). We never trust this payload for the actual outcome — only as a
// prompt to go re-verify the transaction directly against Flutterwave's API
// (verifyTransaction) before finalizing anything in our own database.
module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['POST'])) return;
  if (!isValidWebhookSignature(req)) return fail(res, 401, 'Invalid webhook signature');

  const body = await parseBody(req);
  const reference = body?.data?.tx_ref;
  const transactionId = body?.data?.id;
  if (!reference || !transactionId) return fail(res, 400, 'Missing tx_ref/id in webhook payload');

  const verified = await verifyTransaction(transactionId);
  const success = verified.status === 'successful' && verified.tx_ref === reference;

  const reservation = await one('reservations', reference, 'payment_reference');
  if (!reservation) return fail(res, 404, 'No reservation found for this payment reference');

  const updated = await run(
    getClient().rpc('finalize_payment', { p_reservation_id: reservation.id, p_reference: reference, p_success: success })
  );
  ok(res, updated);
}, res);
