'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '../../../components/AppShell';
import BarChart from '../../../components/BarChart';
import { useSession } from '../../../components/SessionProvider';
import { useToast } from '../../../components/ToastProvider';
import { getOwnerAnalytics } from '../../../lib/api';

export default function OwnerAnalyticsPage() {
  const { session, loading: sessionLoading } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { setLoading(false); return; }
    getOwnerAnalytics()
      .then(setData)
      .catch((err) => showToast(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Owner console</p>
        <h1>Analytics</h1>
        <p className="lead">Reservation and revenue trends across your car parks over the last 30 days.</p>
        <div className="actions"><Link className="btn secondary" href="/owner">Back to console</Link></div>
      </section>

      {sessionLoading || loading ? (
        <section className="panel card"><p className="muted">Loading…</p></section>
      ) : !session ? (
        <section className="panel card">
          <h2>Sign in to continue</h2>
          <div className="actions"><Link className="btn primary" href="/login">Sign in</Link></div>
        </section>
      ) : !data ? (
        <section className="panel card"><p className="muted">No data yet.</p></section>
      ) : (
        <>
          <section className="stats-row" style={{ marginBottom: 20 }}>
            <div className="stat panel card"><strong>{data.totals.totalReservations}</strong><span>reservations (30d)</span></div>
            <div className="stat panel card"><strong>₦{data.totals.totalRevenue}</strong><span>revenue (30d)</span></div>
            <div className="stat panel card"><strong>{data.totals.avgOccupancy}%</strong><span>average occupancy</span></div>
          </section>

          <section className="grid two">
            <article className="panel card">
              <h2>Reservations per day</h2>
              <BarChart data={data.dailyStats} valueKey="reservations" color="var(--blue)" />
            </article>
            <article className="panel card">
              <h2>Revenue per day</h2>
              <BarChart data={data.dailyStats} valueKey="revenue" color="var(--brand)" formatValue={(v) => `₦${v}`} />
            </article>
          </section>

          <section className="panel card" style={{ marginTop: 20 }}>
            <h2>Occupancy by lot</h2>
            {data.lots.length === 0 && <p className="muted">No lots yet.</p>}
            {data.lots.map((lot) => (
              <div key={lot.id} style={{ marginBottom: 12 }}>
                <div className="muted small" style={{ marginBottom: 4 }}>{lot.name} — {lot.capacity - lot.available_spaces}/{lot.capacity} occupied ({lot.occupancyRatio}%)</div>
                <div className="progress-track">
                  <div className="progress-bar open" style={{ width: `${lot.occupancyRatio}%` }} />
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </AppShell>
  );
}
