'use client';

import { useEffect, useRef, useState } from 'react';
import { hasMapboxToken, searchPlaces } from '../lib/mapbox';

export default function DestinationSearchField({ value, onChange, placeholder }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef();

  useEffect(() => {
    if (!hasMapboxToken() || !value || value.trim().length < 3) {
      setSuggestions([]);
      return undefined;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchPlaces(value).then((results) => {
        setSuggestions(results);
        setOpen(results.length > 0);
      });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  function selectPlace(place) {
    // Use just the first segment of the place name (e.g. "Victoria Island" out of
    // "Victoria Island, Lagos, Nigeria") so it still substring-matches an area name.
    onChange(place.name.split(',')[0].trim());
    setOpen(false);
  }

  return (
    <label className="field" style={{ position: 'relative' }}>
      <span>⌕</span>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 && (
        <ul className="place-suggestions" role="listbox">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => selectPlace(s)}>
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
