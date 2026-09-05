'use client';

import { useState } from 'react';
import { useToast } from './ToastProvider';
import { getParks, getUpdates, postUpdate } from '../lib/api';

export default function UpdatesClient({ initialLots, initialReports }) {
  const [lots, setLots] = useState(initialLots);
  const [reports, setReports] = useState(initialReports);
  const [form, setForm] = useState({ parking_lot_id: initialLots[0]?.id || '', user_name: '', status: 'Available', comment: '' });
  const [loading, setLoading] = useState(false);
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
  );
}
