import {
  getExpensesByCategory,
  getMonthlyExpenses,
  getMonthlyMileage,
  getGSTQSTSummary,
  getYearComparison,
} from '../src/utils/dashboardCalculations';

const makeReceipt = (date, amount, category) => ({
  expense: { date, amount, category, vendor: '', description: '' },
  metadata: {},
});

const makeTrip = (date, distance) => ({ date, distance });

describe('getExpensesByCategory', () => {
  it('groups receipts by category', () => {
    const receipts = [
      makeReceipt('2026-01-01', 50, 'fuel'),
      makeReceipt('2026-01-02', 30, 'fuel'),
      makeReceipt('2026-01-03', 20, 'office'),
    ];
    const result = getExpensesByCategory(receipts);
    expect(result).toHaveLength(2);
    expect(result[0].key).toBe('fuel');
    expect(result[0].total).toBe(80);
    expect(result[1].key).toBe('office');
    expect(result[1].total).toBe(20);
  });

  it('handles empty array', () => {
    expect(getExpensesByCategory([])).toEqual([]);
  });
});

describe('getMonthlyExpenses', () => {
  it('aggregates by month for given year', () => {
    const receipts = [
      makeReceipt('2026-01-15', 100, 'fuel'),
      makeReceipt('2026-01-20', 50, 'fuel'),
      makeReceipt('2026-03-01', 200, 'office'),
      makeReceipt('2025-01-01', 999, 'fuel'), // different year - ignored
    ];
    const result = getMonthlyExpenses(receipts, 2026);
    expect(result[0]).toBe(150);  // January
    expect(result[1]).toBe(0);    // February
    expect(result[2]).toBe(200);  // March
    expect(result.length).toBe(12);
  });
});

describe('getMonthlyMileage', () => {
  it('aggregates km by month', () => {
    const trips = [
      makeTrip('2026-02-10', 42),
      makeTrip('2026-02-20', 58),
      makeTrip('2026-06-01', 100),
    ];
    const result = getMonthlyMileage(trips, 2026);
    expect(result[1]).toBe(100);  // February
    expect(result[5]).toBe(100);  // June
  });
});

describe('getGSTQSTSummary', () => {
  it('calculates GST for non-QC province', () => {
    const receipts = [makeReceipt('2026-01-01', 1000, 'fuel')];
    const result = getGSTQSTSummary(receipts, 'ON');
    expect(result.gstPaid).toBe(50);
    expect(result.qstPaid).toBe(0);
    expect(result.totalTaxPaid).toBe(50);
  });

  it('calculates GST + QST for Quebec', () => {
    const receipts = [makeReceipt('2026-01-01', 1000, 'fuel')];
    const result = getGSTQSTSummary(receipts, 'QC');
    expect(result.gstPaid).toBe(50);
    expect(result.qstPaid).toBe(99.75);
    expect(result.totalTaxPaid).toBe(149.75);
  });
});

describe('getYearComparison', () => {
  it('groups by year descending', () => {
    const receipts = [
      makeReceipt('2026-01-01', 100, 'fuel'),
      makeReceipt('2026-06-01', 200, 'fuel'),
      makeReceipt('2025-03-01', 50, 'office'),
    ];
    const result = getYearComparison(receipts);
    expect(result[0].year).toBe(2026);
    expect(result[0].total).toBe(300);
    expect(result[1].year).toBe(2025);
    expect(result[1].total).toBe(50);
  });
});
