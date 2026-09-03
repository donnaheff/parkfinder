// Integration point for a future payment processor (Paystack, per the
// hardening plan's Phase 3 scope) — not wired up yet. A reservation today
// goes straight from "held" to "confirmed" with no money changing hands.
// When payments land, a charge step slots in between as an
// 'awaiting_payment' status (already present in the DB's status enum, see
// supabase/schema.sql) before the reservation is confirmed.

export async function chargeForReservation(_reservation) {
  throw new Error('Payments are not configured yet.');
}

export function isPaymentsEnabled() {
  return false;
}
