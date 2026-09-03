'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import LotCard from '../../components/LotCard';
import { useSession } from '../../components/SessionProvider';
import { useToast } from '../../components/ToastProvider';
import { getParks, getSavedParks, saveParkingLot } from '../../lib/api';

export default function LotsPage() {
  const [destination, setDestination] = useState('');
  const [amenity, setAmenity] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [lots, setLots] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  const { session } = useSession();

  async function runSearch(e, overrides = {}) {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const rows = await getParks({
        q: overrides.q ?? destination,
        amenity: overrides.amenity ?? amenity,
        available: (overrides.onlyAvailable ?? onlyAvailable) ? 'true' : undefined,
      });
      setLots(rows);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get('q') || '';
    if (initialQ) setDestination(initialQ);
    runSearch(null, { q: initialQ });
    if (session) {
      getSavedParks().then((rows) => setSavedIds(new Set(rows.map((r) => r.id)))).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
        <p className="eyebrow">Find spaces fast</p>
        <h1>Parking lots</h1>
        <p className="lead">Filter by destination, amenity, and live availability across every verified and pending car park.</p>
        <form className="search-card" onSubmit={runSearch}>
          <label className="field">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search area or lot name"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </label>
          <label className="field">
            <span>🚘</span>
            <select value={amenity} onChange={(e) => setAmenity(e.target.value)}>
              <option value="">Any amenity</option>
              <option value="ev">EV charging</option>
              <option value="accessible">Accessible</option>
              <option value="bike">Motorbike</option>
              <option value="covered">Covered</option>
              <option value="security">Security</option>
            </select>
          </label>
          <label className="field">
            <span>🅿️</span>
            <select value={onlyAvailable ? 'available' : 'all'} onChange={(e) => setOnlyAvailable(e.target.value === 'available')}>
              <option value="all">All lots</option>
              <option value="available">Only open with spaces</option>
            </select>
          </label>
          <button className="btn primary" type="submit">Apply filters</button>
        </form>
        <div className="actions">
          <Link className="btn secondary" href="/map">View map</Link>
          <Link className="btn secondary" href="/owner">List a car park</Link>
        </div>
      </section>

      <section className="grid aside">
        <aside className="panel card">
          <h2>Backed by live data</h2>
          <ul className="feature-list">
            <li>Search across every verified lot</li>
            <li>Availability and open/closed status straight from the API</li>
            <li>One tap to save a lot to your list</li>
          </ul>
        </aside>
        <article className="panel card">
          <div className="card-header">
            <div>
              <h2>Available lots</h2>
              <p className="muted">{loading ? 'Loading…' : `${lots.length} lot${lots.length === 1 ? '' : 's'} found`}</p>
            </div>
            <span className="pill"><span className="live-dot" /> live feed</span>
          </div>
          <div className="lot-list" aria-live="polite">
            {lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} saved={savedIds.has(lot.id)} onSave={handleSave} />
            ))}
          </div>
        </article>
      </section>
    </AppShell>
  );
}
