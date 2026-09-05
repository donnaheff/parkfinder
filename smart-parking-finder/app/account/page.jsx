'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import {
  createVehicle,
  deletePaymentMethod,
  deleteVehicle,
  getPaymentMethods,
  getVehicles,
  setDefaultVehicle,
} from '../../lib/api';

const EMPTY_VEHICLE = { label: '', license_plate: '', vehicle_type: 'car' };

export default function AccountPage() {
  const { session, loading: sessionLoading } = useSession();
  const [vehicles, setVehicles] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [form, setForm] = useState(EMPTY_VEHICLE);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  function load() {
    setLoading(true);
    Promise.all([getVehicles(), getPaymentMethods()])
      .then(([v, p]) => { setVehicles(v); setPaymentMethods(p); })
      .catch((err) => showToast(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) { setLoading(false); return; }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, sessionLoading]);

  async function handleAddVehicle(e) {
    e.preventDefault();
    try {
      await createVehicle(form);
      showToast('Vehicle added.');
      setForm(EMPTY_VEHICLE);
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleSetDefault(id) {
    try {
      await setDefaultVehicle(id);
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeleteVehicle(id) {
    try {
      await deleteVehicle(id);
      showToast('Vehicle removed.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDeletePaymentMethod(id) {
    try {
      await deletePaymentMethod(id);
      showToast('Payment method removed.');
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Your account</p>
        <h1>Vehicles &amp; payment methods</h1>
        <p className="lead">Save a vehicle for a quicker reserve flow. Cards you&rsquo;ve used before show here for reference — reserving still goes through a fresh checkout each time.</p>
      </section>

      {sessionLoading || loading ? (
        <section className="panel card"><p className="muted">Loading…</p></section>
      ) : !session ? (
        <section className="panel card">
          <h2>Sign in to continue</h2>
          <div className="actions"><Link className="btn primary" href="/login">Sign in</Link></div>
        </section>
      ) : (
        <section className="grid aside">
          <aside className="panel card form-stack">
            <h2>Add a vehicle</h2>
            <form className="form-stack" onSubmit={handleAddVehicle}>
              <label>Label
                <input required placeholder="e.g. My car" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
              </label>
              <label>License plate (optional)
                <input value={form.license_plate} onChange={(e) => setForm((p) => ({ ...p, license_plate: e.target.value }))} />
              </label>
              <label>Type
                <select value={form.vehicle_type} onChange={(e) => setForm((p) => ({ ...p, vehicle_type: e.target.value }))}>
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="van">Van</option>
                  <option value="motorbike">Motorbike</option>
                </select>
              </label>
              <button className="btn primary" type="submit">Add vehicle</button>
            </form>
          </aside>

          <article className="panel card">
            <h2>Your vehicles</h2>
            {vehicles.length === 0 && <p className="muted">No vehicles saved yet.</p>}
            {vehicles.map((v) => (
              <div key={v.id} className="reservation-card">
                <div className="card-header">
                  <div>
                    <h3>{v.label}{v.is_default ? ' · default' : ''}</h3>
                    <div className="muted">{v.vehicle_type}{v.license_plate ? ` · ${v.license_plate}` : ''}</div>
                  </div>
                </div>
                <div className="actions">
                  {!v.is_default && <button className="btn secondary" type="button" onClick={() => handleSetDefault(v.id)}>Make default</button>}
                  <button className="btn danger" type="button" onClick={() => handleDeleteVehicle(v.id)}>Remove</button>
                </div>
              </div>
            ))}

            <h2 style={{ marginTop: 20 }}>Payment methods</h2>
            {paymentMethods.length === 0 && <p className="muted">No cards on file yet — they appear here after a paid reservation.</p>}
            {paymentMethods.map((m) => (
              <div key={m.id} className="reservation-card">
                <div className="card-header">
                  <div>
                    <h3>{m.card_type || 'Card'} •••• {m.card_last4 || '----'}</h3>
                  </div>
                </div>
                <div className="actions">
                  <button className="btn danger" type="button" onClick={() => handleDeletePaymentMethod(m.id)}>Remove</button>
                </div>
              </div>
            ))}
          </article>
        </section>
      )}
    </AppShell>
  );
}
