import {
  parseCSV,
  detectPlatform,
  parseUberCSV,
  parseLyftCSV,
  parseGenericCSV,
  importCSV,
  parseFlexDate,
} from '../src/services/csvImportService';

// ─── parseCSV ────────────────────────────────────────────────

describe('parseCSV', () => {
  it('parses simple CSV', () => {
    const csv = 'Name,Age,City\nAlice,30,Montreal\nBob,25,Toronto';
    const result = parseCSV(csv);
    expect(result.headers).toEqual(['Name', 'Age', 'City']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].Name).toBe('Alice');
    expect(result.rows[0].Age).toBe('30');
    expect(result.rows[1].City).toBe('Toronto');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'Name,Address\n"Smith, John","123 Main St, Suite 4"';
    const result = parseCSV(csv);
    expect(result.rows[0].Name).toBe('Smith, John');
    expect(result.rows[0].Address).toBe('123 Main St, Suite 4');
  });

  it('handles escaped quotes', () => {
    const csv = 'Name,Desc\n"John ""The Rock"" Smith",test';
    const result = parseCSV(csv);
    expect(result.rows[0].Name).toBe('John "The Rock" Smith');
  });

  it('handles CRLF line endings', () => {
    const csv = 'A,B\r\n1,2\r\n3,4';
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });

  it('skips empty lines', () => {
    const csv = 'A,B\n1,2\n\n3,4\n';
    const result = parseCSV(csv);
    expect(result.rows).toHaveLength(2);
  });

  it('returns empty for null/empty input', () => {
    expect(parseCSV(null).rows).toEqual([]);
    expect(parseCSV('').rows).toEqual([]);
    expect(parseCSV('Header\n').rows).toEqual([]);
  });
});

// ─── detectPlatform ──────────────────────────────────────────

describe('detectPlatform', () => {
  it('detects Uber by Trip or Order UUID header', () => {
    expect(detectPlatform(['Trip or Order UUID', 'Driver Payment', 'Begin Trip Time'])).toBe('uber');
  });

  it('detects Uber by Gross Fare header', () => {
    expect(detectPlatform(['Date/Time', 'Gross Fare', 'City'])).toBe('uber');
  });

  it('detects Lyft by Ride ID header', () => {
    expect(detectPlatform(['Ride ID', 'Ride Type', 'Ride Earnings'])).toBe('lyft');
  });

  it('detects Lyft by Driver Earnings header', () => {
    expect(detectPlatform(['Date', 'Driver Earnings', 'Ride Distance'])).toBe('lyft');
  });

  it('returns generic for unknown headers', () => {
    expect(detectPlatform(['Date', 'Amount', 'Description'])).toBe('generic');
  });

  it('is case-insensitive', () => {
    expect(detectPlatform(['trip or order uuid', 'DRIVER PAYMENT', 'Begin Trip Time'])).toBe('uber');
  });
});

// ─── parseFlexDate ───────────────────────────────────────────

describe('parseFlexDate', () => {
  it('parses ISO date (YYYY-MM-DD)', () => {
    expect(parseFlexDate('2026-01-15')).toBe('2026-01-15');
  });

  it('parses ISO datetime', () => {
    expect(parseFlexDate('2026-01-15T10:30:00Z')).toBe('2026-01-15');
  });

  it('parses MM/DD/YYYY', () => {
    expect(parseFlexDate('01/15/2026')).toBe('2026-01-15');
  });

  it('parses M/D/YYYY', () => {
    expect(parseFlexDate('1/5/2026')).toBe('2026-01-05');
  });

  it('parses "Jan 15, 2026"', () => {
    expect(parseFlexDate('Jan 15, 2026')).toBe('2026-01-15');
  });

  it('parses "January 15, 2026"', () => {
    expect(parseFlexDate('January 15, 2026')).toBe('2026-01-15');
  });

  it('parses "Dec 3 2026" (no comma)', () => {
    expect(parseFlexDate('Dec 3 2026')).toBe('2026-12-03');
  });

  it('returns null for empty/invalid input', () => {
    expect(parseFlexDate('')).toBeNull();
    expect(parseFlexDate(null)).toBeNull();
    expect(parseFlexDate('not a date')).toBeNull();
  });
});

// ─── parseUberCSV ────────────────────────────────────────────

describe('parseUberCSV', () => {
  const uberRows = [
    {
      'Begin Trip Time': '2026-01-15T08:30:00Z',
      'Trip Distance': '12.5',
      'Driver Payment': '$25.50',
      'Dropoff Address': '100 King St W, Toronto',
      'Trip Type': 'UberX',
    },
    {
      'Begin Trip Time': '2026-01-16T14:00:00Z',
      'Trip Distance': '8.2',
      'Driver Payment': '$18.00',
      'Dropoff Address': '200 Bay St, Toronto',
      'Trip Type': 'UberXL',
    },
  ];

  it('creates trips from Uber data', () => {
    const result = parseUberCSV(uberRows);
    expect(result.trips).toHaveLength(2);
    expect(result.trips[0].date).toBe('2026-01-15');
    expect(result.trips[0].clientName).toBe('Uber');
    expect(result.trips[0].isBusinessTrip).toBe(true);
  });

  it('converts miles to km', () => {
    const result = parseUberCSV(uberRows);
    // 12.5 miles * 1.60934 = 20.1 km
    expect(result.trips[0].distance).toBeCloseTo(20.1, 0);
  });

  it('creates earnings receipts', () => {
    const result = parseUberCSV(uberRows);
    expect(result.receipts).toHaveLength(2);
    expect(result.receipts[0].expense.amount).toBe(25.50);
    expect(result.receipts[0].expense.vendor).toBe('Uber');
  });

  it('calculates summary correctly', () => {
    const result = parseUberCSV(uberRows);
    expect(result.summary.platform).toBe('Uber');
    expect(result.summary.totalTrips).toBe(2);
    expect(result.summary.totalReceipts).toBe(2);
    expect(result.summary.totalEarnings).toBeCloseTo(43.50, 2);
  });

  it('skips rows with invalid dates', () => {
    const badRows = [{ 'Begin Trip Time': '', 'Trip Distance': '10', 'Driver Payment': '$20' }];
    const result = parseUberCSV(badRows);
    expect(result.trips).toHaveLength(0);
  });

  it('skips zero-distance trips', () => {
    const zeroRows = [{
      'Begin Trip Time': '2026-01-15',
      'Trip Distance': '0',
      'Driver Payment': '$15',
    }];
    const result = parseUberCSV(zeroRows);
    expect(result.trips).toHaveLength(0);
    expect(result.receipts).toHaveLength(1); // Still has earnings
  });

  it('handles $ and comma in amounts', () => {
    const rows = [{
      'Begin Trip Time': '2026-03-01',
      'Trip Distance': '5',
      'Driver Payment': '$1,250.99',
      'Dropoff Address': 'Airport',
      'Trip Type': 'UberBlack',
    }];
    const result = parseUberCSV(rows);
    expect(result.receipts[0].expense.amount).toBe(1250.99);
  });
});

// ─── parseLyftCSV ────────────────────────────────────────────

describe('parseLyftCSV', () => {
  const lyftRows = [
    {
      'Date': '01/20/2026',
      'Ride Distance (mi)': '15.0',
      'Ride Earnings': '$32.00',
      'Dropoff Location': '500 University Ave',
      'Ride Type': 'Lyft',
    },
    {
      'Date': '01/22/2026',
      'Ride Distance (mi)': '6.3',
      'Ride Earnings': '$14.50',
      'Dropoff Location': 'Eaton Centre',
      'Ride Type': 'Lyft XL',
    },
  ];

  it('creates trips from Lyft data', () => {
    const result = parseLyftCSV(lyftRows);
    expect(result.trips).toHaveLength(2);
    expect(result.trips[0].date).toBe('2026-01-20');
    expect(result.trips[0].clientName).toBe('Lyft');
  });

  it('converts miles to km', () => {
    const result = parseLyftCSV(lyftRows);
    // 15.0 miles * 1.60934 = 24.1 km
    expect(result.trips[0].distance).toBeCloseTo(24.1, 0);
  });

  it('creates earnings receipts', () => {
    const result = parseLyftCSV(lyftRows);
    expect(result.receipts).toHaveLength(2);
    expect(result.receipts[0].expense.amount).toBe(32.00);
    expect(result.receipts[0].expense.vendor).toBe('Lyft');
  });

  it('calculates summary', () => {
    const result = parseLyftCSV(lyftRows);
    expect(result.summary.platform).toBe('Lyft');
    expect(result.summary.totalEarnings).toBeCloseTo(46.50, 2);
  });
});

// ─── parseGenericCSV ─────────────────────────────────────────

describe('parseGenericCSV', () => {
  it('maps generic columns by name', () => {
    const headers = ['Date', 'Distance', 'Amount', 'Vendor'];
    const rows = [
      { Date: '2026-02-01', Distance: '25', Amount: '$40', Vendor: 'DoorDash' },
    ];
    const result = parseGenericCSV(rows, headers);
    expect(result.trips).toHaveLength(1);
    expect(result.trips[0].distance).toBe(25);
    expect(result.receipts[0].expense.amount).toBe(40);
    expect(result.receipts[0].expense.vendor).toBe('DoorDash');
  });

  it('returns CSV as platform', () => {
    const headers = ['Date', 'Amount'];
    const rows = [{ Date: '2026-01-01', Amount: '10' }];
    const result = parseGenericCSV(rows, headers);
    expect(result.summary.platform).toBe('CSV');
  });

  it('handles missing columns gracefully', () => {
    const headers = ['Date', 'Notes'];
    const rows = [{ Date: '2026-01-01', Notes: 'Test' }];
    const result = parseGenericCSV(rows, headers);
    expect(result.trips).toHaveLength(0);
    expect(result.receipts).toHaveLength(0);
  });
});

// ─── importCSV (integration) ─────────────────────────────────

describe('importCSV', () => {
  it('auto-detects Uber CSV and parses', () => {
    const csv = [
      'Begin Trip Time,Trip Distance,Driver Payment,Dropoff Address,Trip Type',
      '2026-01-10,10.0,$22.00,Downtown,UberX',
      '2026-01-11,5.5,$12.50,Airport,UberXL',
    ].join('\n');

    const result = importCSV(csv);
    expect(result.summary.platform).toBe('Uber');
    expect(result.trips).toHaveLength(2);
    expect(result.receipts).toHaveLength(2);
  });

  it('auto-detects Lyft CSV and parses', () => {
    const csv = [
      'Date,Ride Distance (mi),Ride Earnings,Ride Type',
      '01/10/2026,8.0,$18.00,Lyft',
    ].join('\n');

    const result = importCSV(csv);
    expect(result.summary.platform).toBe('Lyft');
    expect(result.trips).toHaveLength(1);
  });

  it('falls back to generic for unknown CSV', () => {
    const csv = [
      'Date,Distance,Amount,Vendor',
      '2026-03-01,30,50.00,SkipTheDishes',
    ].join('\n');

    const result = importCSV(csv);
    expect(result.summary.platform).toBe('CSV');
    expect(result.trips).toHaveLength(1);
    expect(result.receipts).toHaveLength(1);
  });

  it('returns empty for empty CSV', () => {
    const result = importCSV('Header1,Header2\n');
    expect(result.trips).toHaveLength(0);
    expect(result.receipts).toHaveLength(0);
    expect(result.summary.totalTrips).toBe(0);
  });

  it('handles large Uber export', () => {
    const header = 'Begin Trip Time,Trip Distance,Driver Payment,Dropoff Address,Trip Type';
    const rows = Array.from({ length: 100 }, (_, i) =>
      `2026-01-${String((i % 28) + 1).padStart(2, '0')},${(i + 1) * 2},$${(i + 1) * 5}.00,Location ${i},UberX`
    );
    const csv = [header, ...rows].join('\n');
    const result = importCSV(csv);
    expect(result.trips).toHaveLength(100);
    expect(result.receipts).toHaveLength(100);
    expect(result.summary.totalTrips).toBe(100);
  });

  it('sets CRA retention date on imported receipts', () => {
    const csv = 'Begin Trip Time,Trip Distance,Driver Payment\n2026-06-15,10,$20';
    const result = importCSV(csv);
    expect(result.receipts[0].metadata.retainUntil).toBeDefined();
    // 2026 tax year end = 2026-12-31 + 6 years = 2032-12-31
    expect(result.receipts[0].metadata.retainUntil).toContain('2032');
  });

  it('marks all imported trips as business', () => {
    const csv = 'Begin Trip Time,Trip Distance,Driver Payment\n2026-01-01,10,$20';
    const result = importCSV(csv);
    expect(result.trips[0].isBusinessTrip).toBe(true);
    expect(result.trips[0].type).toBe('business');
  });

  it('adds source tag to imported data', () => {
    const csv = 'Begin Trip Time,Trip Distance,Driver Payment\n2026-01-01,10,$20';
    const result = importCSV(csv);
    expect(result.trips[0].source).toBe('uber-csv');
    expect(result.receipts[0].metadata.source).toBe('uber-csv');
  });
});
