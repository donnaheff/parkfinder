'use client';

import { useEffect, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { availabilityClass } from '../lib/format';
import { hasMapboxToken } from '../lib/mapbox';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
// Used only until real lot coordinates load (lots start empty and are
// fetched async) — the map then recenters on their centroid below, so this
// isn't a Lagos-only assumption baked into the app.
const FALLBACK_CENTER = { longitude: 3.3792, latitude: 6.5244 };

export default function CityMap({ lots, selectedId, onSelect, userLocation, height = 520 }) {
  const [viewState, setViewState] = useState({ ...FALLBACK_CENTER, zoom: 11 });
  const [centered, setCentered] = useState(false);

  const geocodedLots = lots.filter((l) => l.latitude != null && l.longitude != null);

  useEffect(() => {
    if (centered || geocodedLots.length === 0) return;
    const sum = geocodedLots.reduce((acc, l) => ({ longitude: acc.longitude + l.longitude, latitude: acc.latitude + l.latitude }), { longitude: 0, latitude: 0 });
    setViewState((v) => ({ ...v, longitude: sum.longitude / geocodedLots.length, latitude: sum.latitude / geocodedLots.length }));
    setCentered(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocodedLots.length, centered]);

  if (!hasMapboxToken()) {
    return (
      <div className="map-wrap map-token-missing" style={{ minHeight: height }}>
        <p className="muted">
          Live map requires a Mapbox token.<br />
          Set <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to enable it (free tier at mapbox.com).
        </p>
      </div>
    );
  }

  return (
    <div className="map-wrap" style={{ height }}>
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        reuseMaps
      >
        <NavigationControl position="top-right" showCompass={false} />
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="user-location-dot" title="Your location" />
          </Marker>
        )}
        {geocodedLots.map((lot) => (
          <Marker
            key={lot.id}
            longitude={lot.longitude}
            latitude={lot.latitude}
            anchor="bottom"
            onClick={(e) => { e.originalEvent.stopPropagation(); onSelect?.(lot.id); }}
          >
            <button
              type="button"
              className={`map-pin ${availabilityClass(lot)} ${selectedId === lot.id ? 'selected' : ''}`}
              aria-label={`${lot.name}: ${lot.available_spaces} spaces`}
            >
              <span>{lot.available_spaces}</span>
            </button>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
