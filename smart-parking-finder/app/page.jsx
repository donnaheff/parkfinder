'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import LotCard from '../components/LotCard';
import { useToast } from '../components/ToastProvider';
import { getParks, getSavedParks, getUserId, saveParkingLot } from '../lib/api';

export default function HomePage() {
  const [destination, setDestination] = useState('');
  const [amenity, setAmenity] = useState('');
  const [lots, setLots] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const showToast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getParks({ available: 'true' })
      .then((rows) => { if (!cancelled) setLots(rows); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    const userId = getUserId();
    getSavedParks(userId)
      .then((rows) => { if (!cancelled) setSavedIds(new Set(rows.map((r) => r.id))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const totalSpaces = useMemo(() => lots.reduce((sum, l) => sum + (l.available_spaces || 0), 0), [lots]);
  const avgWalk = useMemo(() => {
    if (!lots.length) return 0;
    return Math.round(lots.reduce((sum, l) => sum + (l.walk_meters || 0), 0) / lots.length);
  }, [lots]);
  const topLots = lots.slice(0, 3);

  async function handleSearch(event) {
    event.preventDefault();
    try {
      const rows = await getParks({ q: destination, amenity });
      setLots(rows);
      showToast(`${rows.length} matching parking options found.`);
    } catch (err) {
      showToast(err.message);
    }
  }

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
        <p className="eyebrow">Live parking data</p>
        <h1>Find and reserve real parking spaces before you arrive.</h1>
        <p className="lead">
          ParkSwift searches live availability across Lagos car parks, backed by the real Supabase-powered API —
          no mock data, no simulated sensors.
        </p>
        <form className="search-card" onSubmit={handleSearch}>
          <label className="field">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Where are you going? e.g. Victoria Island"
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
          <button className="btn primary" type="submit">Find spaces</button>
        </form>
        <div className="stats-row">
          <div className="stat"><strong>{totalSpaces}</strong><span>live spaces nearby</span></div>
          <div className="stat"><strong>{avgWalk}m</strong><span>average walk distance</span></div>
          <div className="stat"><strong>{lots.length}</strong><span>lots matching your search</span></div>
        </div>
      </section>

      <section className="grid three">
        <Link className="card" href="/map"><span className="badge premium">Live</span><h2>Parking map</h2><p className="muted">See markers for every open car park, positioned by the real data.</p></Link>
        <Link className="card" href="/lots"><span className="badge">Search</span><h2>Parking lots</h2><p className="muted">Browse and filter every lot by availability, amenities, and area.</p></Link>
        <Link className="card" href="/owner"><span className="badge free">Owner</span><h2>List your car park</h2><p className="muted">Register as an owner and submit a lot for verification.</p></Link>
      </section>

      <section className="panel card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div>
            <h2>Top available options</h2>
            <p className="muted">{error ? error : loading ? 'Loading live availability…' : 'Preview only — open Parking lots for the full list.'}</p>
          </div>
          <Link className="btn secondary" href="/lots">View all</Link>
        </div>
        <div className="grid three" style={{ marginTop: 12 }}>
          {topLots.map((lot) => (
            <LotCard key={lot.id} lot={lot} compact saved={savedIds.has(lot.id)} onSave={handleSave} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
