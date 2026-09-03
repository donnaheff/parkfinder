'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import LotCard from '../../components/LotCard';
import { useToast } from '../../components/ToastProvider';
import { getParks, getSavedParks, getUserId, saveParkingLot } from '../../lib/api';
import { availabilityClass } from '../../lib/format';

export default function MapPage() {
  const [lots, setLots] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [clock, setClock] = useState('');
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  async function load() {
    setLoading(true);
    try {
      const rows = await getParks({});
      setLots(rows);
      if (rows.length && !rows.some((l) => l.id === selectedId)) setSelectedId(rows[0].id);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const userId = getUserId();
    getSavedParks(userId).then((rows) => setSavedIds(new Set(rows.map((r) => r.id)))).catch(() => {});
    const tick = () => setClock(new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedLot = lots.find((l) => l.id === selectedId) || null;

  async function handleSave(lot) {
    try {
      const userId = getUserId();
      await saveParkingLot(userId, lot.id);
      setSavedIds((prev) => new Set(prev).add(lot.id));
      showToast(`${lot.name} saved to your list.`);
    } catch (err) {
      showToast(err.message);
    }
  }

  return (
    <AppShell>
      <section className="panel page-hero">
        <p className="eyebrow">Live sensor grid</p>
        <h1>Live parking map</h1>
        <p className="lead">Tap a marker to inspect availability for that car park. Positions are driven by each lot&rsquo;s real map coordinates.</p>
        <div className="actions">
          <button className="btn secondary" type="button" onClick={load}>Refresh live data</button>
          <span className="pill"><span className="live-dot" /><span>{clock || 'Syncing…'}</span></span>
        </div>
      </section>

      <section className="grid aside">
        <article className="panel map-shell">
          <div className="map-head">
            <div>
              <h2>City sensor grid</h2>
              <p className="muted">{selectedLot ? `${selectedLot.name}: ${selectedLot.available_spaces} spaces` : 'Tap a marker to view spaces'}</p>
            </div>
            <span className="pill"><span className="live-dot" /> {loading ? 'updating' : 'live'}</span>
          </div>
          <div className="map-wrap" aria-label="City parking map">
            <svg className="city-map" viewBox="0 0 760 520" role="img" aria-label="Road map">
              <path className="road major" d="M45 410 C170 330 255 340 365 270 S570 120 720 100" />
              <path className="road" d="M88 80 C185 160 268 162 356 145 C480 120 560 172 674 250" />
              <path className="road" d="M118 490 C165 390 210 295 260 190 C306 96 346 54 405 32" />
              <path className="road" d="M475 500 C450 395 433 320 458 230 C483 145 528 90 615 40" />
              <path className="road" d="M36 270 C126 240 215 248 305 300 C414 360 531 390 706 345" />
            </svg>
            {lots.map((lot) => (
              <button
                key={lot.id}
                type="button"
                className={`marker ${availabilityClass(lot)} ${selectedId === lot.id ? 'selected' : ''}`}
                style={{ left: `${lot.map_x}%`, top: `${lot.map_y}%` }}
                aria-label={`${lot.name}: ${lot.available_spaces} spaces`}
                onClick={() => setSelectedId(lot.id)}
              >
                <span>{lot.available_spaces}</span>
              </button>
            ))}
            <div className="map-legend">
              <div className="legend-item"><span className="swatch" /> Plenty of spaces</div>
              <div className="legend-item"><span className="swatch warn" /> Filling fast</div>
              <div className="legend-item"><span className="swatch danger" /> Full / closed</div>
            </div>
          </div>
        </article>
        <aside className="panel card">
          <h2>Selected lot</h2>
          {selectedLot ? (
            <LotCard lot={selectedLot} saved={savedIds.has(selectedLot.id)} onSave={handleSave} />
          ) : (
            <p className="muted">No lots to show yet.</p>
          )}
        </aside>
      </section>
    </AppShell>
  );
}
