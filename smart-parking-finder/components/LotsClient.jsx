'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import DestinationSearchField from './DestinationSearchField';
import LotCard from './LotCard';
import { useSession } from './SessionProvider';
import { useToast } from './ToastProvider';
import { getParks, getSavedParks, saveParkingLot } from '../lib/api';
import { distanceMeters, getCurrentLocation, walkMinutes } from '../lib/geo';

export default function LotsClient({ initialLots, initialQuery }) {
  const [destination, setDestination] = useState(initialQuery);
  const [amenity, setAmenity] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [lots, setLots] = useState(initialLots);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
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
    if (!session) return;
    let cancelled = false;
    getSavedParks().then((rows) => { if (!cancelled) setSavedIds(new Set(rows.map((r) => r.id))); }).catch(() => {});
    return () => { cancelled = true; };
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

  async function handleLocate() {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      showToast('Sorted by distance from your location.');
    } catch (err) {
      showToast(err.message);
    } finally {
      setLocating(false);
    }
  }

  const lotsWithDistance = useMemo(() => {
    if (!userLocation) return lots.map((lot) => ({ lot, meters: null }));
    return lots
      .map((lot) => ({
        lot,
        meters: lot.latitude != null ? distanceMeters(userLocation, { lat: lot.latitude, lng: lot.longitude }) : null,
      }))
      .sort((a, b) => (a.meters ?? Infinity) - (b.meters ?? Infinity));
  }, [lots, userLocation]);

  return (
    <>
      <section className="panel page-hero">
        <p className="eyebrow">Find spaces fast</p>
        <h1>Parking lots</h1>
        <p className="lead">Filter by destination, amenity, and live availability across every verified and pending car park.</p>
        <form className="search-card" onSubmit={runSearch}>
          <DestinationSearchField
            value={destination}
            onChange={setDestination}
            placeholder="Search area or lot name"
          />
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
          <button className="btn secondary" type="button" onClick={handleLocate} disabled={locating}>
            {locating ? 'Locating…' : userLocation ? 'Update my location' : 'Sort by distance from me'}
          </button>
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
              <p className="muted">{loading ? 'Loading…' : `${lots.length} lot${lots.length === 1 ? '' : 's'} found${userLocation ? ', sorted by distance' : ''}`}</p>
            </div>
            <span className="pill"><span className="live-dot" /> live feed</span>
          </div>
          <div className="lot-list" aria-live="polite">
            {lotsWithDistance.map(({ lot, meters }) => (
              <LotCard
                key={lot.id}
                lot={lot}
                saved={savedIds.has(lot.id)}
                onSave={handleSave}
                liveWalkMinutes={meters != null ? walkMinutes(meters) : null}
              />
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
