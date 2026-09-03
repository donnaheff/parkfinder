'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from './SessionProvider';
import { useToast } from './ToastProvider';
import { createReservation } from '../lib/api';

const DURATIONS = [1, 2, 3, 4, 8, 24];

export default function ReserveButton({ lot }) {
  const { session } = useSession();
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(1);
  const [busy, setBusy] = useState(false);

  const full = lot.available_spaces === 0 || !lot.is_open;

  function toggle() {
    if (!session) { showToast('Sign in to reserve a space.'); return; }
    setOpen((o) => !o);
  }

  async function handleReserve() {
    setBusy(true);
    try {
      const start = new Date();
      const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
      await createReservation({ parking_lot_id: lot.id, start_time: start.toISOString(), end_time: end.toISOString() });
      showToast(`Space held at ${lot.name} for 10 minutes — confirm it from My Reservations.`);
      setOpen(false);
      router.push('/reservations');
    } catch (err) {
      showToast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn blue" type="button" disabled={full} onClick={toggle}>
        {full ? 'Full' : 'Reserve'}
      </button>
      {open && (
        <div className="reserve-popover">
          <label className="field">
            <span>⏱️</span>
            <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {DURATIONS.map((h) => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}
            </select>
          </label>
          <div className="actions" style={{ marginTop: 8 }}>
            <button className="btn primary" type="button" onClick={handleReserve} disabled={busy}>
              {busy ? 'Holding…' : 'Hold this space'}
            </button>
            <button className="btn secondary" type="button" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
            Holds a space for 10 minutes while you confirm — no payment required yet.
          </p>
        </div>
      )}
    </div>
  );
}
