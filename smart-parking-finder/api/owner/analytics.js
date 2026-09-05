const { ok, requireMethod } = require('../_lib/http');
const { getClient, run, handle } = require('../_lib/supabase');
const { requireOwner } = require('../_lib/auth');

const DAYS = 30;

function dayKey(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

module.exports = async (req, res) => handle(async () => {
  if (!requireMethod(req, res, ['GET'])) return;
  const owner = await requireOwner(req, res);
  if (!owner) return;
  const client = getClient();

  const lots = await run(
    client.from('parking_lots').select('id, name, capacity, available_spaces').eq('owner_id', owner.id)
  );
  const lotIds = lots.map((l) => l.id);

  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString();
  const reservations = lotIds.length
    ? await run(
        client.from('reservations').select('lot_id, status, payment_status, amount, created_at')
          .in('lot_id', lotIds).gte('created_at', since)
      )
    : [];

  // Build a zero-filled series for the last DAYS days so the chart doesn't
  // have gaps on days with no activity, then fill in from the raw rows.
  const byDay = new Map();
  for (let i = DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay.set(dayKey(d.toISOString()), { date: dayKey(d.toISOString()), reservations: 0, revenue: 0 });
  }
  let totalRevenue = 0;
  for (const r of reservations) {
    const key = dayKey(r.created_at);
    const entry = byDay.get(key);
    if (!entry) continue; // outside the window edge case
    entry.reservations += 1;
    if (r.payment_status === 'paid') {
      entry.revenue += Number(r.amount) || 0;
      totalRevenue += Number(r.amount) || 0;
    }
  }

  const lotStats = lots.map((l) => ({
    id: l.id,
    name: l.name,
    capacity: l.capacity,
    available_spaces: l.available_spaces,
    occupancyRatio: l.capacity ? Math.round(((l.capacity - l.available_spaces) / l.capacity) * 100) : 0,
  }));

  ok(res, {
    lots: lotStats,
    dailyStats: Array.from(byDay.values()),
    totals: {
      totalReservations: reservations.length,
      totalRevenue,
      avgOccupancy: lotStats.length ? Math.round(lotStats.reduce((s, l) => s + l.occupancyRatio, 0) / lotStats.length) : 0,
    },
  });
}, res);
