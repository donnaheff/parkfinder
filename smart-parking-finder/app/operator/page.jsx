'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '../../components/AppShell';
import { useToast } from '../../components/ToastProvider';
import { getParks, updateAvailability, updateOpenStatus } from '../../lib/api';
import { occupancyRatio } from '../../lib/format';

export default function OperatorPage() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  async function load() {
    setLoading(true);
    try {
      setLots(await getParks({}));
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpis = useMemo(() => {
    const managed = lots.length;
    const avgOccupancy = managed
      ? Math.round(lots.reduce((sum, l) => sum + (100 - occupancyRatio(l)), 0) / managed)
      : 0;
    const openCount = lots.filter((l) => l.is_open).length;
    const totalAvailable = lots.reduce((sum, l) => sum + (l.available_spaces || 0), 0);
    return { managed, avgOccupancy, openCount, totalAvailable };
  }, [lots]);

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
      showToast(`${lot.name} marked ${!lot.is_open ? 'open' : 'closed'}.`);
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Parking operators</p>
        <h1>Operator occupancy console</h1>
        <p className="lead">Monitor occupancy across every car park and toggle open/closed status in real time.</p>
      </section>

      <section className="grid aside">
        <article className="panel card">
          <div className="card-header">
            <div>
              <h2>Operations dashboard</h2>
              <p className="muted">{loading ? 'Loading…' : 'Live occupancy from the API'}</p>
            </div>
            <span className="pill"><span className="live-dot" /> operator console</span>
          </div>
          <div className="kpi-grid">
            <div className="kpi"><strong>{kpis.managed}</strong><span>managed locations</span></div>
            <div className="kpi"><strong>{kpis.avgOccupancy}%</strong><span>avg occupancy</span></div>
            <div className="kpi"><strong>{kpis.openCount}</strong><span>currently open</span></div>
            <div className="kpi"><strong>{kpis.totalAvailable}</strong><span>total available spaces</span></div>
          </div>
          <div style={{ marginTop: 16 }}>
            {lots.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr><th>Lot</th><th>Occupancy</th><th>Status</th><th>Controls</th></tr>
                </thead>
                <tbody>
                  {lots.map((lot) => (
                    <tr key={lot.id}>
                      <td>{lot.name}<div className="muted small">{lot.area}</div></td>
                      <td>
                        <div className="mini-bar"><span style={{ width: `${100 - occupancyRatio(lot)}%` }} /></div>
                        <span className="muted small">{lot.available_spaces}/{lot.capacity} free</span>
                      </td>
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
          </div>
        </article>
        <aside className="panel card">
          <h2>Maintenance queue</h2>
          <div className="timeline" style={{ marginTop: 12 }}>
            <div className="timeline-item"><div className="timeline-time">High</div><div className="muted">Lekki camera counter needs recalibration.</div></div>
            <div className="timeline-item"><div className="timeline-time">Medium</div><div className="muted">Marina level 3 payment kiosk paper low.</div></div>
            <div className="timeline-item"><div className="timeline-time">Low</div><div className="muted">Adeniji wayfinding sign cleaning scheduled.</div></div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
