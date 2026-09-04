import { describe, expect, it } from 'vitest';
import { lotFromBody, missingLotFields, normalizeAmenityKey } from './parking.js';

describe('normalizeAmenityKey', () => {
  it('maps shorthand keys to their canonical amenity name', () => {
    expect(normalizeAmenityKey('ev')).toBe('ev_charging');
    expect(normalizeAmenityKey('bike')).toBe('motorbike');
  });

  it('passes through keys that are already canonical or unknown', () => {
    expect(normalizeAmenityKey('accessible')).toBe('accessible');
    expect(normalizeAmenityKey('valet')).toBe('valet');
  });
});

describe('missingLotFields', () => {
  it('flags empty required fields', () => {
    expect(missingLotFields({ name: '', area: 'Ikoyi', address: '' })).toEqual(['name', 'address']);
  });

  it('returns an empty array when all required fields are present', () => {
    expect(missingLotFields({ name: 'A', area: 'B', address: 'C' })).toEqual([]);
  });
});

describe('lotFromBody', () => {
  const baseBody = { name: 'Civic Centre Garage', area: 'Victoria Island', address: '1 Civic Way' };

  it('clamps capacity to at least 1 and available_spaces into [0, capacity]', () => {
    expect(lotFromBody({ ...baseBody, capacity: 0, available_spaces: -5 }).capacity).toBe(1);
    expect(lotFromBody({ ...baseBody, capacity: 0, available_spaces: -5 }).available_spaces).toBe(0);
    expect(lotFromBody({ ...baseBody, capacity: 10, available_spaces: 999 }).available_spaces).toBe(10);
  });

  it('assigns the given owner id and marks the lot owner-listed', () => {
    const lot = lotFromBody(baseBody, 'owner-123');
    expect(lot.owner_id).toBe('owner-123');
    expect(lot.owner_listed).toBe(true);
  });

  it('defaults to pending verification and open status', () => {
    const lot = lotFromBody(baseBody, 'owner-123');
    expect(lot.verification_status).toBe('pending');
    expect(lot.is_open).toBe(true);
  });

  it('carries EV connector type and power through into amenities when charging is enabled', () => {
    const lot = lotFromBody({
      ...baseBody,
      amenities: { ev_charging: true, ev_connector_type: 'CCS2', ev_kw: '50' },
    });
    expect(lot.amenities.ev_charging).toBe(true);
    expect(lot.amenities.ev_connector_type).toBe('CCS2');
    expect(lot.amenities.ev_kw).toBe(50);
  });

  it('defaults security and lighting to true unless explicitly disabled', () => {
    const lot = lotFromBody(baseBody);
    expect(lot.amenities.security).toBe(true);
    expect(lot.amenities.lighting).toBe(true);
    const disabled = lotFromBody({ ...baseBody, amenities: { security: false, lighting: false } });
    expect(disabled.amenities.security).toBe(false);
    expect(disabled.amenities.lighting).toBe(false);
  });

  it('trims whitespace-only required fields down to empty strings caught by missingLotFields', () => {
    const lot = lotFromBody({ name: '  ', area: 'Ikoyi', address: '1 Road' });
    expect(missingLotFields(lot)).toEqual(['name']);
  });

  it('defaults price_per_hour to 0 (free/unset) and clamps negative values', () => {
    expect(lotFromBody(baseBody).price_per_hour).toBe(0);
    expect(lotFromBody({ ...baseBody, price_per_hour: -50 }).price_per_hour).toBe(0);
    expect(lotFromBody({ ...baseBody, price_per_hour: '250' }).price_per_hour).toBe(250);
  });
});
