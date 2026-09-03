'use client';

import { amenityChips, availabilityClass, availabilityText, occupancyRatio, directionsUrl } from '../lib/format';

export default function LotCard({ lot, compact = false, saved = false, onSave, onRoute, liveWalkMinutes }) {
  const cls = availabilityClass(lot);
  const ratio = occupancyRatio(lot);
  const chips = amenityChips(lot.amenities);

  return (
    <article className="card lot-card">
      <div className="card-header">
        <div>
          <h3>{lot.name}</h3>
          <div className="muted">{lot.area}</div>
        </div>
        <span className={`badge ${cls}`}>{availabilityText(lot)}</span>
      </div>
      <div className="lot-meta">
        <span>🅿️ {lot.available_spaces}/{lot.capacity} spaces</span>
        <span>🚗 {lot.drive_minutes} min</span>
        {liveWalkMinutes != null ? (
          <span title="Walk time from your location">🚶 {liveWalkMinutes} min (live)</span>
        ) : (
          <span>🚶 {lot.walk_meters}m</span>
        )}
        <span>⭐ {lot.rating}</span>
        {chips.map((chip) => (
          <span key={chip.label}>{chip.icon} {chip.label}</span>
        ))}
      </div>
      <div className="progress-track">
        <div className={`progress-bar ${cls}`} style={{ width: `${ratio}%` }} />
      </div>
      {!compact && (
        <div className="lot-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={() => (onRoute ? onRoute(lot) : window.open(directionsUrl(lot), '_blank'))}
          >
            Directions
          </button>
          <button
            className="btn primary"
            type="button"
            disabled={!onSave}
            onClick={() => onSave && onSave(lot)}
          >
            {saved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      )}
    </article>
  );
}
