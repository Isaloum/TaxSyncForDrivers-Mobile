jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 'high' },
}));

import { haversineDistance, calculateRouteDistance, formatDuration } from '../src/services/locationService';

describe('haversineDistance', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistance(45.5017, -73.5673, 45.5017, -73.5673)).toBe(0);
  });

  it('calculates Montreal to Quebec City (~233 km)', () => {
    const d = haversineDistance(45.5017, -73.5673, 46.8139, -71.2080);
    expect(d).toBeGreaterThan(220);
    expect(d).toBeLessThan(250);
  });

  it('calculates short city distance (~1-2 km)', () => {
    // Downtown Montreal to Old Port (~1.5 km)
    const d = haversineDistance(45.5017, -73.5673, 45.5088, -73.5540);
    expect(d).toBeGreaterThan(0.5);
    expect(d).toBeLessThan(3);
  });

  it('calculates Toronto to Ottawa (~350 km)', () => {
    const d = haversineDistance(43.6532, -79.3832, 45.4215, -75.6972);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(370);
  });
});

describe('calculateRouteDistance', () => {
  it('returns 0 for empty array', () => {
    expect(calculateRouteDistance([])).toBe(0);
  });

  it('returns 0 for single point', () => {
    expect(calculateRouteDistance([{ latitude: 45.5, longitude: -73.5 }])).toBe(0);
  });

  it('calculates distance for two points', () => {
    const d = calculateRouteDistance([
      { latitude: 45.5017, longitude: -73.5673 },
      { latitude: 45.5088, longitude: -73.5540 },
    ]);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(3);
  });

  it('accumulates distance for multiple points', () => {
    const route = [
      { latitude: 45.5017, longitude: -73.5673 },
      { latitude: 45.5050, longitude: -73.5600 },
      { latitude: 45.5088, longitude: -73.5540 },
    ];
    const total = calculateRouteDistance(route);
    const direct = calculateRouteDistance([route[0], route[2]]);
    // Route via waypoint should be >= direct distance
    expect(total).toBeGreaterThanOrEqual(direct);
  });

  it('rounds to 1 decimal place', () => {
    const d = calculateRouteDistance([
      { latitude: 45.5017, longitude: -73.5673 },
      { latitude: 45.5088, longitude: -73.5540 },
    ]);
    const decimals = String(d).split('.')[1] || '';
    expect(decimals.length).toBeLessThanOrEqual(1);
  });

  it('handles null input', () => {
    expect(calculateRouteDistance(null)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats 0 seconds', () => {
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('00:00:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('00:02:05');
  });

  it('formats hours, minutes, seconds', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('formats large duration', () => {
    expect(formatDuration(7200)).toBe('02:00:00');
  });
});
