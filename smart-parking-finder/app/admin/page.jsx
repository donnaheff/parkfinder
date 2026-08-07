'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { adminDecision, getAdminSubmissions, getAdminToken, storeAdminToken } from '../../lib/api';
import { verificationLabel } from '../../lib/format';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const showToast = useToast();

  useEffect(() => {
    setToken(getAdminToken());
  }, []);

  async function loadSubmissions(activeToken) {
    setLoading(true);
    setError('');
    try {
      setSubmissions(await getAdminSubmissions(activeToken));
    } catch (err) {
      setError(err.message);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }

  function handleTokenSubmit(e) {
    e.preventDefault();
    storeAdminToken(token);
    loadSubmissions(token);
  }

  async function decide(id, action) {
    try {
      await adminDecision(id, action, '', token);
      showToast(`Listing ${action.replace('-', ' ')}d.`);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Moderation</p>
        <h1>Admin verification queue</h1>
        <p className="lead">Review owner-submitted car parks before they go live. Requires the admin token configured on the API (env var <code>ADMIN_TOKEN</code>).</p>
        <form className="search-card" style={{ gridTemplateColumns: '1fr auto' }} onSubmit={handleTokenSubmit}>
          <label className="field">
            <span>🔑</span>
            <input
              type="password"
              placeholder="Admin token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <button className="btn primary" type="submit">Load submissions</button>
        </form>
      </section>

      <section className="panel card">
        <div className="card-header">
          <div>
            <h2>Pending submissions</h2>
            <p className="muted">{loading ? 'Loading…' : error ? error : `${submissions.length} awaiting review`}</p>
          </div>
        </div>
        {submissions.map((lot) => (
          <div key={lot.id} className="card" style={{ marginBottom: 12 }}>
            <div className="card-header">
              <div>
                <h3>{lot.name}</h3>
                <div className="muted">{lot.area} · {lot.address}</div>
              </div>
              <span className="badge">{verificationLabel(lot.verification_status)}</span>
            </div>
            <div className="lot-meta">
              <span>🅿️ {lot.available_spaces}/{lot.capacity} spaces</span>
              <span>🚶 {lot.walk_meters}m</span>
              <span>🚗 {lot.drive_minutes} min</span>
            </div>
            <div className="actions">
              <button className="btn primary" type="button" onClick={() => decide(lot.id, 'approve')}>Approve</button>
              <button className="btn secondary" type="button" onClick={() => decide(lot.id, 'request-info')}>Request info</button>
              <button className="btn danger" type="button" onClick={() => decide(lot.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
        {!loading && !error && submissions.length === 0 && <p className="muted">Nothing pending review.</p>}
      </section>
    </AppShell>
  );
}
