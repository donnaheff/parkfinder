'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { getParks, getUpdates, postUpdate } from '../../lib/api';

export default function UpdatesPage() {
  const [lots, setLots] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState({ parking_lot_id: '', user_name: '', status: 'Available', comment: '' });
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  async function load() {
    setLoading(true);
    try {
      const [lotRows, reportRows] = await Promise.all([getParks({}), getUpdates()]);
      setLots(lotRows);
      setReports(reportRows);
      if (lotRows.length && !form.parking_lot_id) {
        setForm((prev) => ({ ...prev, parking_lot_id: lotRows[0].id }));
      }
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await postUpdate({
        parking_lot_id: form.parking_lot_id,
        user_name: form.user_name || 'Guest',
        status: form.status,
        comment: form.comment,
      });
      showToast('Community report recorded.');
      setForm((prev) => ({ ...prev, comment: '' }));
      load();
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Community reports</p>
        <h1>Live status updates</h1>
        <p className="lead">Drivers can flag when a car park is full, filling fast, or has a security concern — helping keep availability accurate between sensor syncs.</p>
      </section>

      <section className="grid aside">
        <aside className="panel card">
          <h2>Post an update</h2>
          <form className="form-stack" onSubmit={handleSubmit}>
            <label>Car park
              <select value={form.parking_lot_id} onChange={(e) => setForm((p) => ({ ...p, parking_lot_id: e.target.value }))}>
                {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.name}</option>)}
              </select>
            </label>
            <label>Your name
              <input value={form.user_name} onChange={(e) => setForm((p) => ({ ...p, user_name: e.target.value }))} placeholder="Guest" />
            </label>
            <label>Status
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option>Available</option>
                <option>Filling fast</option>
                <option>Full</option>
                <option>Security concern</option>
              </select>
            </label>
            <label>Comment
              <textarea rows={3} value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} />
            </label>
            <button className="btn primary" type="submit">Post update</button>
          </form>
        </aside>
        <article className="panel card">
          <div className="card-header">
            <div><h2>Recent reports</h2><p className="muted">{loading ? 'Loading…' : `${reports.length} reports`}</p></div>
          </div>
          <div className="timeline">
            {reports.map((report) => (
              <div key={report.id} className="timeline-item">
                <div className="timeline-time">{report.status}</div>
                <div>
                  <strong>{report.lot_name}</strong>
                  <div className="muted small">{report.user_name} · {new Date(report.created_at).toLocaleString()}</div>
                  {report.comment && <p className="muted">{report.comment}</p>}
                </div>
              </div>
            ))}
            {!loading && reports.length === 0 && <p className="muted">No reports yet.</p>}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
