import { payForReservation } from './api';

// NEXT_PUBLIC_* is baked in at build time (this is a client-rendered app),
// so this only reflects whether the build was configured with a Flutterwave
// key, not live server state. It's used to decide whether to show a "Pay
// now" affordance at all; the server independently enforces the real check
// (api/reservations/[id]/pay.js returns 503 if unconfigured) and free lots
// (price_per_hour is 0/unset) never need payment regardless of this flag.
export function isPaymentsEnabled() {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';
}

// Starts payment for a held reservation. Free lots resolve immediately
// (confirmed server-side, no redirect) — the caller should treat a `free`
// result as done. Otherwise this redirects the browser to Flutterwave's
// hosted checkout and never resolves from the caller's perspective.
export async function payAndRedirect(reservationId) {
  const result = await payForReservation(reservationId);
  if (result.free) return result;
  window.location.href = result.checkoutUrl;
  return result;
}
