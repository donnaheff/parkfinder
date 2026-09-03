'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import { cancelReservation, confirmReservation, getReservations } from '../../lib/api';

function statusLabel(status) {
  switch (status) {
    case 'held': return 'Held';
    case 'awaiting_payment': return 'Awaiting payment';
    case 'confirmed': return 'Confirmed';
    case 'cancelled': return 'Cancelled';
    case 'completed': return 'Completed';
    default: return status;
  }
}

function CountdownBadge({ expiresAt }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!expiresAt) return null;
  const remainingMs = new Date(expiresAt).getTime() - now;
  if (remainingMs <= 0) return <span className="reservation-countdown">Expiring…</span>;
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  return <span className="reservation-countdown">Expires in {mins}:{String(secs).padStart(2, '0')}</span>;
}

export default function ReservationsPage() {
  const { session, loading: sessionLoading } = useSession();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  async function load() {
    setLoading(true);
    try {
      setReservations(await getReservations());
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionLoading) return;
    if (session) load(); else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  async function handleConfirm(id) {
    try {
      await confirmReservation(id);
      showToast('Reservation confirmed.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleCancel(id) {
    try {
      await cancelReservation(id);
      showToast('Reservation cancelled.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">My bookings</p>
        <h1>Reservations</h1>
        <p className="lead">Holds expire after 10 minutes unless confirmed. Payment isn&rsquo;t wired up yet — confirming a hold doesn&rsquo;t charge you anything.</p>
      </section>

      {!sessionLoading && !session ? (
        <section className="panel card">
          <h2>Sign in to continue</h2>
          <div className="actions"><Link className="btn primary" href="/login">Sign in</Link></div>
        </section>
      ) : (
        <section className="panel card">
          <div className="card-header">
            <div>
              <h2>Your reservations</h2>
              <p className="muted">{loading ? 'Loading…' : `${reservations.length} total`}</p>
            </div>
          </div>
          {reservations.map((r) => (
            <div key={r.id} className="reservation-card">
              <div className="card-header">
                <div>
                  <h3>{r.parking_lots?.name || 'Parking lot'}</h3>
                  <div className="muted">{r.parking_lots?.area}</div>
                </div>
                <span className="badge">{statusLabel(r.status)}</span>
              </div>
              <div className="lot-meta">
                <span>🕐 {new Date(r.start_time).toLocaleString()} → {new Date(r.end_time).toLocaleString()}</span>
              </div>
              {r.status === 'held' && r.hold_expires_at && <CountdownBadge expiresAt={r.hold_expires_at} />}
              {(r.status === 'held' || r.status === 'confirmed') && (
                <div className="actions">
                  {r.status === 'held' && <button className="btn primary" type="button" onClick={() => handleConfirm(r.id)}>Confirm</button>}
                  <button className="btn danger" type="button" onClick={() => handleCancel(r.id)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
          {!loading && reservations.length === 0 && <p className="muted">No reservations yet — reserve a space from Parking lots or the map.</p>}
        </section>
      )}
    </AppShell>
  );
}
