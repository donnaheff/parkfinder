'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import {
  createOwnerPark,
  getMyOwnerProfile,
  getOwnerParks,
  registerOwner,
  updateAvailability,
  updateOpenStatus,
} from '../../lib/api';
import { verificationLabel } from '../../lib/format';
import { geocodeAddress, hasMapboxToken } from '../../lib/mapbox';

const EMPTY_LOT_FORM = {
  name: '', area: '', type: 'Open car park', address: '', opening_hours: '06:00–22:00',
  capacity: 60, available_spaces: 20, walk_meters: 350, drive_minutes: 8,
  ev_charging: false, accessible: true, motorbike: true, covered: false, security: true,
};

export default function OwnerPage() {
  const { session, user, loading: sessionLoading } = useSession();
  const [owner, setOwner] = useState(null);
  const [ownerLoading, setOwnerLoading] = useState(true);
  const [registerForm, setRegisterForm] = useState({ name: '', phone: '', business_name: '' });
  const [lotForm, setLotForm] = useState(EMPTY_LOT_FORM);
  const [lots, setLots] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { setOwner(null); setOwnerLoading(false); return; }
    setOwnerLoading(true);
    getMyOwnerProfile()
      .then((result) => { setOwner(result); if (result) loadLots(); })
      .catch((err) => showToast(err.message))
      .finally(() => setOwnerLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  async function loadLots() {
    setLotsLoading(true);
    try {
      setLots(await getOwnerParks());
    } catch (err) {
      showToast(err.message);
    } finally {
      setLotsLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const result = await registerOwner(registerForm);
      setOwner(result);
      showToast(`Welcome, ${result.name}. You're registered as an owner.`);
      loadLots();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleAddLot(e) {
    e.preventDefault();
    try {
      const body = {
        name: lotForm.name,
        area: lotForm.area,
        type: lotForm.type,
        address: lotForm.address,
        opening_hours: lotForm.opening_hours,
        capacity: Number(lotForm.capacity),
        available_spaces: Number(lotForm.available_spaces),
        walk_meters: Number(lotForm.walk_meters),
        drive_minutes: Number(lotForm.drive_minutes),
        amenities: {
          ev_charging: lotForm.ev_charging,
          accessible: lotForm.accessible,
          motorbike: lotForm.motorbike,
          covered: lotForm.covered,
          security: lotForm.security,
        },
      };
      if (hasMapboxToken()) {
        const place = await geocodeAddress(`${lotForm.address}, ${lotForm.area}, Lagos, Nigeria`);
        if (place) {
          body.latitude = place.lat;
          body.longitude = place.lng;
        }
      }
      await createOwnerPark(body);
      showToast(body.latitude != null ? 'Parking lot submitted for verification (address located on map).' : 'Parking lot submitted for verification.');
      setLotForm(EMPTY_LOT_FORM);
      loadLots();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function adjustSpaces(lot, delta) {
    const next = Math.max(0, Math.min(lot.capacity, lot.available_spaces + delta));
    try {
      await updateAvailability(lot.id, next);
      setLots((prev) => prev.map((l) => (l.id === lot.id ? { ...l, available_spaces: next } : l)));
    } catch (err) {
      showToast(err.message);
    }
  }

  async function toggleOpen(lot) {
    try {
      await updateOpenStatus(lot.id, !lot.is_open);
      setLots((prev) => prev.map((l) => (l.id === lot.id ? { ...l, is_open: !l.is_open } : l)));
    } catch (err) {
      showToast(err.message);
    }
  }

  function setLotField(key, value) {
    setLotForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Parking owner console</p>
        <h1>List and manage your car parks.</h1>
        <p className="lead">Register once, then submit lots for admin verification and keep live availability up to date — all backed by the real API.</p>
        {owner && <div className="actions"><span className="pill">Signed in as {owner.name}</span></div>}
      </section>

      {sessionLoading || ownerLoading ? (
        <section className="panel card"><p className="muted">Loading…</p></section>
      ) : !session ? (
        <section className="panel card">
          <h2>Sign in to continue</h2>
          <p className="muted">You need an account to register as an owner and manage listings.</p>
          <div className="actions"><Link className="btn primary" href="/login">Sign in</Link></div>
        </section>
      ) : !owner ? (
        <section className="panel card">
          <h2>Register as an owner</h2>
          <p className="muted">Signed in as {user?.email}.</p>
          <form className="form-stack" onSubmit={handleRegister}>
            <label>Full name
              <input required value={registerForm.name} onChange={(e) => setRegisterForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label>Business name
              <input value={registerForm.business_name} onChange={(e) => setRegisterForm((p) => ({ ...p, business_name: e.target.value }))} />
            </label>
            <label>Phone
              <input required value={registerForm.phone} onChange={(e) => setRegisterForm((p) => ({ ...p, phone: e.target.value }))} />
            </label>
            <button className="btn primary" type="submit">Register</button>
          </form>
        </section>
      ) : (
        <section className="grid aside">
          <aside className="panel card form-stack">
            <h2>Add a parking lot</h2>
            <form className="form-stack" onSubmit={handleAddLot}>
              <label>Lot name
                <input required value={lotForm.name} onChange={(e) => setLotField('name', e.target.value)} />
              </label>
              <label>Area
                <input required value={lotForm.area} onChange={(e) => setLotField('area', e.target.value)} />
              </label>
              <label>Address
                <input required value={lotForm.address} onChange={(e) => setLotField('address', e.target.value)} />
              </label>
              <div className="grid two">
                <label>Capacity
                  <input type="number" min="1" value={lotForm.capacity} onChange={(e) => setLotField('capacity', e.target.value)} />
                </label>
                <label>Available spaces
                  <input type="number" min="0" value={lotForm.available_spaces} onChange={(e) => setLotField('available_spaces', e.target.value)} />
                </label>
              </div>
              <div className="grid two">
                <label>Walk distance (m)
                  <input type="number" min="0" value={lotForm.walk_meters} onChange={(e) => setLotField('walk_meters', e.target.value)} />
                </label>
                <label>Drive time (min)
                  <input type="number" min="1" value={lotForm.drive_minutes} onChange={(e) => setLotField('drive_minutes', e.target.value)} />
                </label>
              </div>
              <label><span><input type="checkbox" checked={lotForm.ev_charging} onChange={(e) => setLotField('ev_charging', e.target.checked)} /> EV charging</span></label>
              <label><span><input type="checkbox" checked={lotForm.accessible} onChange={(e) => setLotField('accessible', e.target.checked)} /> Accessible bays</span></label>
              <label><span><input type="checkbox" checked={lotForm.motorbike} onChange={(e) => setLotField('motorbike', e.target.checked)} /> Motorbike support</span></label>
              <label><span><input type="checkbox" checked={lotForm.covered} onChange={(e) => setLotField('covered', e.target.checked)} /> Covered parking</span></label>
              <button className="btn primary" type="submit">Submit for verification</button>
            </form>
          </aside>

          <article className="panel card">
            <div className="card-header">
              <div>
                <h2>Your parking lots</h2>
                <p className="muted">{lotsLoading ? 'Loading…' : `${lots.length} listed`}</p>
              </div>
            </div>
            {lots.length === 0 && !lotsLoading && <p className="muted">No lots yet — add one from the form.</p>}
            {lots.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Spaces</th><th>Status</th><th>Open</th><th>Controls</th></tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id}>
                      <td>{lot.name}<div className="muted small">{lot.area}</div></td>
                      <td>{lot.available_spaces}/{lot.capacity}</td>
                      <td>{verificationLabel(lot.verification_status)}</td>
                      <td>{lot.is_open ? 'Open' : 'Closed'}</td>
                      <td>
                        <div className="inline-controls">
                          <button className="btn secondary" type="button" onClick={() => adjustSpaces(lot, -1)}>−1</button>
                          <button className="btn secondary" type="button" onClick={() => adjustSpaces(lot, 1)}>+1</button>
                          <button className="btn secondary" type="button" onClick={() => toggleOpen(lot)}>{lot.is_open ? 'Close' : 'Reopen'}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        </section>
      )}
    </AppShell>
  );
}
