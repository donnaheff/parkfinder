'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './SessionProvider';
import { useToast } from './ToastProvider';
import { createReservation, getVehicles } from '../lib/api';

const DURATIONS = [1, 2, 3, 4, 8, 24];

// YYYY-MM-DDTHH:mm in local time, as <input type="datetime-local"> needs —
// toISOString() would shift to UTC and show the wrong wall-clock time.
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ReserveButton({ lot }) {
  const { session } = useSession();
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(1);
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date()));
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [busy, setBusy] = useState(false);

  const full = lot.available_spaces === 0 || !lot.is_open;
  const nowLocal = toLocalInputValue(new Date());

  useEffect(() => {
    if (!session) { setVehicles([]); return; }
    getVehicles()
      .then((rows) => {
        setVehicles(rows);
        const def = rows.find((v) => v.is_default) || rows[0];
        if (def) setVehicleId(def.id);
      })
      .catch(() => {});
  }, [session]);

  async function handleReserve() {
    if (!session && !guestEmail.trim()) { showToast('Enter an email to reserve without an account.'); return; }
    setBusy(true);
    try {
      const start = new Date(startAt);
      const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
      const result = await createReservation({
        parking_lot_id: lot.id,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        guest_name: guestName || undefined,
        guest_email: guestEmail || undefined,
        guest_phone: guestPhone || undefined,
        vehicle_id: vehicleId || undefined,
      });
      setOpen(false);
      if (result.checkoutUrl) {
        showToast('Redirecting you to complete payment…');
        window.location.href = result.checkoutUrl;
        return;
      }
      if (result.guest) {
        showToast(`Space confirmed at ${lot.name} — check your email for details.`);
      } else {
        showToast(`Space held at ${lot.name} for 10 minutes — confirm it from My Reservations.`);
        router.push('/reservations');
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn blue" type="button" disabled={full} onClick={() => setOpen((o) => !o)}>
        {full ? 'Full' : 'Reserve'}
      </button>
      {open && (
        <div className="reserve-popover">
          <label className="field">
            <span>📅</span>
            <input type="datetime-local" value={startAt} min={nowLocal} onChange={(e) => setStartAt(e.target.value)} />
          </label>
          <label className="field">
            <span>⏱️</span>
            <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {DURATIONS.map((h) => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
            </select>
          </label>
          {!session && (
            <>
              <label className="field"><span>✉️</span><input type="email" required placeholder="Email (required)" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} /></label>
              <label className="field"><span>👤</span><input placeholder="Name (optional)" value={guestName} onChange={(e) => setGuestName(e.target.value)} /></label>
              <label className="field"><span>📱</span><input type="tel" placeholder="Phone (optional)" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} /></label>
            </>
          )}
          {session && vehicles.length > 0 && (
            <label className="field">
              <span>🚗</span>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </label>
          )}
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn primary" type="button" onClick={handleReserve} disabled={busy}>
              {busy ? 'Holding…' : 'Hold this space'}
            </button>
            <button className="btn secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
            {!session
              ? 'No account needed — a confirmation goes to your email.'
              : lot.price_per_hour > 0
                ? `Holds a space for 10 minutes — pay ${lot.price_per_hour}/hr from My Reservations to confirm.`
                : 'Holds a space for 10 minutes while you confirm — this lot is free.'}
          </p>
        </div>
      )}
    </div>
  );
}
