import {
  calculateSimplifiedDeduction,
  calculateBusinessPercentage,
  getTripSummary,
  getLastOdometerReading,
  checkCRAThreshold,
} from '../src/utils/mileageCalculations';

describe('calculateSimplifiedDeduction', () => {
  it('returns 0 for 0 km', () => {
    expect(calculateSimplifiedDeduction(0)).toBe(0);
  });

  it('calculates correctly under 5000 km', () => {
    expect(calculateSimplifiedDeduction(3000)).toBe(3000 * 0.70);
  });

  it('calculates correctly at exactly 5000 km', () => {
    expect(calculateSimplifiedDeduction(5000)).toBe(5000 * 0.70);
  });

  it('calculates correctly over 5000 km', () => {
    const expected = 5000 * 0.70 + 3000 * 0.64;
    expect(calculateSimplifiedDeduction(8000)).toBe(expected);
  });

  it('adds northern territory bonus', () => {
    const base = 3000 * 0.70;
    const bonus = 3000 * 0.04;
    expect(calculateSimplifiedDeduction(3000, true)).toBe(base + bonus);
  });

  it('returns 0 for negative km', () => {
    expect(calculateSimplifiedDeduction(-100)).toBe(0);
  });
});

describe('calculateBusinessPercentage', () => {
  it('returns 0 for empty array', () => {
    expect(calculateBusinessPercentage([])).toBe(0);
  });

  it('returns 100 for all business trips', () => {
    const trips = [
      { distance: 50, isBusinessTrip: true },
      { distance: 100, isBusinessTrip: true },
    ];
    expect(calculateBusinessPercentage(trips)).toBe(100);
  });

  it('returns 0 for all personal trips', () => {
    const trips = [
      { distance: 50, isBusinessTrip: false },
      { distance: 100, isBusinessTrip: false },
    ];
    expect(calculateBusinessPercentage(trips)).toBe(0);
  });

  it('calculates mixed trips correctly', () => {
    const trips = [
      { distance: 75, isBusinessTrip: true },
      { distance: 25, isBusinessTrip: false },
    ];
    expect(calculateBusinessPercentage(trips)).toBe(75);
  });
});

describe('getTripSummary', () => {
  it('aggregates trip statistics', () => {
    const trips = [
      { distance: 50, isBusinessTrip: true },
      { distance: 30, isBusinessTrip: false },
      { distance: 20, isBusinessTrip: true },
    ];
    const summary = getTripSummary(trips);

    expect(summary.totalKm).toBe(100);
    expect(summary.businessKm).toBe(70);
    expect(summary.personalKm).toBe(30);
    expect(summary.totalTrips).toBe(3);
    expect(summary.businessTripCount).toBe(2);
    expect(summary.personalTripCount).toBe(1);
    expect(summary.businessPercent).toBe(70);
    expect(summary.estimatedDeduction).toBe(70 * 0.70);
  });

  it('handles empty array', () => {
    const summary = getTripSummary([]);
    expect(summary.totalKm).toBe(0);
    expect(summary.estimatedDeduction).toBe(0);
  });
});

describe('getLastOdometerReading', () => {
  it('returns 0 for empty array', () => {
    expect(getLastOdometerReading([])).toBe(0);
  });

  it('returns endOdometer of most recent trip', () => {
    const trips = [
      { date: '2026-01-01', endOdometer: 5000 },
      { date: '2026-02-01', endOdometer: 8000 },
      { date: '2026-01-15', endOdometer: 6500 },
    ];
    expect(getLastOdometerReading(trips)).toBe(8000);
  });
});

describe('checkCRAThreshold', () => {
  it('does not flag under 90%', () => {
    const result = checkCRAThreshold(85);
    expect(result.exceedsThreshold).toBe(false);
  });

  it('does not flag exactly 90%', () => {
    const result = checkCRAThreshold(90);
    expect(result.exceedsThreshold).toBe(false);
  });

  it('flags over 90%', () => {
    const result = checkCRAThreshold(95);
    expect(result.exceedsThreshold).toBe(true);
    expect(result.threshold).toBe(90);
  });
});
