const { filterReceipts, sortReceipts, filterTrips, sortTrips } = require('../src/utils/filterSort');

// ---- Sample data ----

const receipts = [
  { id: '1', date: '2026-01-15', expense: { vendor: 'Shell', amount: 45.50, category: 'fuel', description: 'Gas fill-up' } },
  { id: '2', date: '2026-02-10', expense: { vendor: 'Canadian Tire', amount: 120.00, category: 'maintenance', description: 'Oil change' } },
  { id: '3', date: '2026-01-20', expense: { vendor: 'Staples', amount: 30.00, category: 'office', description: 'Printer paper' } },
  { id: '4', date: '2026-03-05', expense: { vendor: 'Petro-Canada', amount: 55.00, category: 'fuel', description: 'Fuel' } },
  { id: '5', date: '2026-02-25', expense: { vendor: 'Bell', amount: 85.00, category: 'telephone', description: 'Monthly bill' } },
];

const trips = [
  { id: '1', date: '2026-01-10', destination: 'Client office', purpose: 'Meeting', distance: 25, isBusinessTrip: true, clientName: 'Uber' },
  { id: '2', date: '2026-02-15', destination: 'Grocery store', purpose: 'Shopping', distance: 8, isBusinessTrip: false, clientName: '' },
  { id: '3', date: '2026-01-28', destination: 'Airport', purpose: 'Delivery', distance: 45, isBusinessTrip: true, clientName: 'DoorDash' },
  { id: '4', date: '2026-03-01', destination: 'Mechanic', purpose: 'Car repair', distance: 12, isBusinessTrip: false, clientName: '' },
  { id: '5', date: '2026-02-20', destination: 'Downtown', purpose: 'Client visit', distance: 30, isBusinessTrip: true, clientName: 'Skip' },
];

// ---- Receipt filter tests ----

describe('filterReceipts', () => {
  test('returns all receipts with no filters', () => {
    const result = filterReceipts(receipts, {});
    expect(result).toHaveLength(5);
  });

  test('filters by category', () => {
    const result = filterReceipts(receipts, { category: 'fuel' });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.expense.category === 'fuel')).toBe(true);
  });

  test('filters by search query (vendor)', () => {
    const result = filterReceipts(receipts, { search: 'shell' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('filters by search query (description)', () => {
    const result = filterReceipts(receipts, { search: 'oil change' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('filters by search + category combined', () => {
    const result = filterReceipts(receipts, { search: 'fuel', category: 'fuel' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  test('returns empty for no matches', () => {
    const result = filterReceipts(receipts, { search: 'xyz123' });
    expect(result).toHaveLength(0);
  });

  test('search by date partial', () => {
    const result = filterReceipts(receipts, { search: '2026-01' });
    expect(result).toHaveLength(2);
  });

  test('category "all" returns everything', () => {
    const result = filterReceipts(receipts, { category: 'all' });
    expect(result).toHaveLength(5);
  });
});

// ---- Receipt sort tests ----

describe('sortReceipts', () => {
  test('sorts by date descending (newest first)', () => {
    const result = sortReceipts(receipts, 'date_desc');
    expect(result[0].id).toBe('4'); // 2026-03-05
    expect(result[4].id).toBe('1'); // 2026-01-15
  });

  test('sorts by date ascending (oldest first)', () => {
    const result = sortReceipts(receipts, 'date_asc');
    expect(result[0].id).toBe('1'); // 2026-01-15
    expect(result[4].id).toBe('4'); // 2026-03-05
  });

  test('sorts by amount descending (highest first)', () => {
    const result = sortReceipts(receipts, 'amount_desc');
    expect(result[0].id).toBe('2'); // $120
    expect(result[4].id).toBe('3'); // $30
  });

  test('sorts by amount ascending (lowest first)', () => {
    const result = sortReceipts(receipts, 'amount_asc');
    expect(result[0].id).toBe('3'); // $30
    expect(result[4].id).toBe('2'); // $120
  });

  test('does not mutate original array', () => {
    const original = [...receipts];
    sortReceipts(receipts, 'date_desc');
    expect(receipts).toEqual(original);
  });
});

// ---- Trip filter tests ----

describe('filterTrips', () => {
  test('returns all trips with no filters', () => {
    const result = filterTrips(trips, {});
    expect(result).toHaveLength(5);
  });

  test('filters business trips', () => {
    const result = filterTrips(trips, { tripType: 'business' });
    expect(result).toHaveLength(3);
    expect(result.every((t) => t.isBusinessTrip)).toBe(true);
  });

  test('filters personal trips', () => {
    const result = filterTrips(trips, { tripType: 'personal' });
    expect(result).toHaveLength(2);
    expect(result.every((t) => !t.isBusinessTrip)).toBe(true);
  });

  test('filters by search query (destination)', () => {
    const result = filterTrips(trips, { search: 'airport' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  test('filters by search query (client name)', () => {
    const result = filterTrips(trips, { search: 'doordash' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  test('filters by search + type combined', () => {
    const result = filterTrips(trips, { search: 'client', tripType: 'business' });
    expect(result).toHaveLength(2); // Client office + Downtown (client visit)
  });

  test('type "all" returns everything', () => {
    const result = filterTrips(trips, { tripType: 'all' });
    expect(result).toHaveLength(5);
  });
});

// ---- Trip sort tests ----

describe('sortTrips', () => {
  test('sorts by date descending', () => {
    const result = sortTrips(trips, 'date_desc');
    expect(result[0].id).toBe('4'); // 2026-03-01
    expect(result[4].id).toBe('1'); // 2026-01-10
  });

  test('sorts by date ascending', () => {
    const result = sortTrips(trips, 'date_asc');
    expect(result[0].id).toBe('1'); // 2026-01-10
    expect(result[4].id).toBe('4'); // 2026-03-01
  });

  test('sorts by distance descending (longest first)', () => {
    const result = sortTrips(trips, 'distance_desc');
    expect(result[0].id).toBe('3'); // 45 km
    expect(result[4].id).toBe('2'); // 8 km
  });

  test('sorts by distance ascending (shortest first)', () => {
    const result = sortTrips(trips, 'distance_asc');
    expect(result[0].id).toBe('2'); // 8 km
    expect(result[4].id).toBe('3'); // 45 km
  });

  test('does not mutate original array', () => {
    const original = [...trips];
    sortTrips(trips, 'date_desc');
    expect(trips).toEqual(original);
  });
});
