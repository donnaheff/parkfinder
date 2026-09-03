'use client';

import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import CityMap from '../../components/CityMap';
import LotCard from '../../components/LotCard';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import { getParks, getSavedParks, saveParkingLot } from '../../lib/api';
import { distanceMeters, getCurrentLocation, walkMinutes } from '../../lib/geo';

export default function MapPage() {
  const [lots, setLots] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [clock, setClock] = useState('');
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const showToast = useToast();
  const { session } = useSession();

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
    if (session) {
      getSavedParks().then((rows) => setSavedIds(new Set(rows.map((r) => r.id)))).catch(() => {});
    }
    const tick = () => setClock(new Intl.DateTimeFormat('en-NG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const selectedLot = lots.find((l) => l.id === selectedId) || null;
  const selectedDistance = userLocation && selectedLot?.latitude != null
    ? distanceMeters(userLocation, { lat: selectedLot.latitude, lng: selectedLot.longitude })
    : null;

  async function handleLocate() {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      showToast('Using your current location.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLocating(false);
    }
  }

  async function handleSave(lot) {
    if (!session) { showToast('Sign in to save parking lots.'); return; }
    try {
      await saveParkingLot(lot.id);
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
        <p className="lead">Tap a marker to inspect availability for that car park. Positions come from each lot&rsquo;s real coordinates.</p>
        <div className="actions">
          <button className="btn secondary" type="button" onClick={load}>Refresh live data</button>
          <button className="btn secondary" type="button" onClick={handleLocate} disabled={locating}>
            {locating ? 'Locating…' : userLocation ? 'Update my location' : 'Use my location'}
          </button>
          <span className="pill"><span className="live-dot" /><span>{clock || 'Syncing…'}</span></span>
        </div>
      </section>

      <section className="grid aside">
        <article className="panel map-shell">
          <div className="map-head">
            <div>
              <h2>City map</h2>
              <p className="muted">{selectedLot ? `${selectedLot.name}: ${selectedLot.available_spaces} spaces` : 'Tap a marker to view spaces'}</p>
            </div>
            <span className="pill"><span className="live-dot" /> {loading ? 'updating' : 'live'}</span>
          </div>
          <CityMap lots={lots} selectedId={selectedId} onSelect={setSelectedId} userLocation={userLocation} />
        </article>
        <aside className="panel card">
          <h2>Selected lot</h2>
          {selectedLot ? (
            <LotCard
              lot={selectedLot}
              saved={savedIds.has(selectedLot.id)}
              onSave={handleSave}
              liveWalkMinutes={selectedDistance != null ? walkMinutes(selectedDistance) : null}
            />
          ) : (
            <p className="muted">No lots to show yet.</p>
          )}
        </aside>
      </section>
    </AppShell>
  );
}
