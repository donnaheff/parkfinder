import { describe, expect, it } from 'vitest';
import {
  amenityChips,
  availabilityClass,
  availabilityText,
  directionsUrl,
  holdCountdownText,
  occupancyRatio,
  priceText,
  reservationStatusLabel,
  verificationLabel,
} from './format';

describe('availabilityClass / availabilityText', () => {
  it('treats a closed lot as full regardless of spaces', () => {
    const lot = { is_open: false, available_spaces: 40, capacity: 60 };
    expect(availabilityClass(lot)).toBe('full');
    expect(availabilityText(lot)).toBe('Closed');
  });

  it('treats zero available spaces as full', () => {
    const lot = { is_open: true, available_spaces: 0, capacity: 60 };
    expect(availabilityClass(lot)).toBe('full');
    expect(availabilityText(lot)).toBe('Full');
  });

  it('flags low availability under 25% occupancy remaining', () => {
    const lot = { is_open: true, available_spaces: 10, capacity: 60 };
    expect(availabilityClass(lot)).toBe('low');
    expect(availabilityText(lot)).toBe('Filling fast');
  });

  it('is open when 25% or more spaces remain', () => {
    const lot = { is_open: true, available_spaces: 20, capacity: 60 };
    expect(availabilityClass(lot)).toBe('open');
    expect(availabilityText(lot)).toBe('Available');
  });
});

describe('occupancyRatio', () => {
  it('rounds to the nearest percent', () => {
    expect(occupancyRatio({ available_spaces: 20, capacity: 60 })).toBe(33);
  });

  it('returns 0 for a lot with no capacity instead of dividing by zero', () => {
    expect(occupancyRatio({ available_spaces: 0, capacity: 0 })).toBe(0);
  });
});

describe('amenityChips', () => {
  it('returns an empty list for missing amenities', () => {
    expect(amenityChips(null)).toEqual([]);
    expect(amenityChips(undefined)).toEqual([]);
  });

  it('skips falsy amenities and EV detail keys from the generic chip list', () => {
    const chips = amenityChips({ accessible: true, covered: false, ev_charging: false, ev_connector_type: 'CCS2' });
    expect(chips).toEqual([{ icon: '♿', label: 'Access' }]);
  });

  it('folds EV connector type and power into a single detailed chip', () => {
    const chips = amenityChips({ ev_charging: true, ev_connector_type: 'CCS2', ev_kw: 50 });
    expect(chips).toEqual([{ icon: '⚡', label: 'EV (CCS2 · 50kW)' }]);
  });

  it('falls back to a plain EV chip when no detail is set', () => {
    const chips = amenityChips({ ev_charging: true });
    expect(chips).toEqual([{ icon: '⚡', label: 'EV' }]);
  });

  it('falls back to a bullet icon for unknown amenity keys', () => {
    const chips = amenityChips({ valet: true });
    expect(chips).toEqual([{ icon: '•', label: 'valet' }]);
  });
});

describe('priceText', () => {
  it('reports "Free" for an unset or zero price', () => {
    expect(priceText({ price_per_hour: 0 })).toBe('Free');
    expect(priceText({})).toBe('Free');
  });

  it('formats a positive hourly rate', () => {
    expect(priceText({ price_per_hour: 250 })).toBe('₦250/hr');
  });
});

describe('directionsUrl', () => {
  const lot = { name: 'Civic Centre Garage', address: '1 Civic Way', area: 'Victoria Island' };

  it('defaults to OpenStreetMap', () => {
    expect(directionsUrl(lot)).toContain('openstreetmap.org');
  });

  it('supports Google and Apple Maps providers', () => {
    expect(directionsUrl(lot, 'google')).toContain('google.com/maps');
    expect(directionsUrl(lot, 'apple')).toContain('maps.apple.com');
  });
});

describe('verificationLabel', () => {
  it('maps known statuses to display labels', () => {
    expect(verificationLabel('verified')).toBe('Verified');
    expect(verificationLabel('rejected')).toBe('Rejected');
    expect(verificationLabel('more_info_requested')).toBe('More info requested');
  });

  it('defaults unknown/pending statuses to "Pending review"', () => {
    expect(verificationLabel('pending')).toBe('Pending review');
    expect(verificationLabel(undefined)).toBe('Pending review');
  });
});

describe('reservationStatusLabel', () => {
  it('maps every known reservation status', () => {
    expect(reservationStatusLabel('held')).toBe('Held');
    expect(reservationStatusLabel('awaiting_payment')).toBe('Awaiting payment');
    expect(reservationStatusLabel('confirmed')).toBe('Confirmed');
    expect(reservationStatusLabel('cancelled')).toBe('Cancelled');
    expect(reservationStatusLabel('completed')).toBe('Completed');
  });

  it('passes through unrecognized statuses unchanged', () => {
    expect(reservationStatusLabel('some_future_status')).toBe('some_future_status');
  });
});

describe('holdCountdownText', () => {
  it('returns null when there is no expiry', () => {
    expect(holdCountdownText(null)).toBeNull();
  });

  it('reports "Expiring…" once the hold has expired', () => {
    const now = Date.now();
    expect(holdCountdownText(new Date(now - 1000).toISOString(), now)).toBe('Expiring…');
  });

  it('formats remaining time as mm:ss', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 90 * 1000).toISOString();
    expect(holdCountdownText(expiresAt, now)).toBe('Expires in 1:30');
  });

  it('zero-pads seconds under 10', () => {
    const now = Date.now();
    const expiresAt = new Date(now + 65 * 1000).toISOString();
    expect(holdCountdownText(expiresAt, now)).toBe('Expires in 1:05');
  });
});
