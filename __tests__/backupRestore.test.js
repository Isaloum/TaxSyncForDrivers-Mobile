jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/doc/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

import { validateBackup } from '../src/utils/exportService';

describe('validateBackup', () => {
  const validBackup = {
    version: '1.0.0',
    exportedAt: '2026-01-15T10:00:00.000Z',
    receipts: [
      {
        id: 'receipt_001',
        timestamp: '2026-01-15T10:00:00.000Z',
        expense: { date: '2026-01-15', amount: 45.99, vendor: 'Shell', category: 'fuel', description: 'Gas' },
        metadata: { uploadedAt: '2026-01-15T10:00:00.000Z', retainUntil: '2032-12-31T00:00:00.000Z', auditStatus: 'active' },
      },
    ],
    trips: [
      {
        id: 'trip_001',
        date: '2026-01-15',
        destination: 'Airport',
        purpose: 'Delivery',
        startOdometer: 50000,
        endOdometer: 50025,
        distance: 25,
        isBusinessTrip: true,
        clientName: 'Client A',
        notes: '',
      },
    ],
  };

  it('accepts a valid backup', () => {
    const result = validateBackup(validBackup);
    expect(result.valid).toBe(true);
    expect(result.receipts).toBe(1);
    expect(result.trips).toBe(1);
  });

  it('accepts backup with empty arrays', () => {
    const result = validateBackup({ version: '1.0.0', exportedAt: '2026-01-01', receipts: [], trips: [] });
    expect(result.valid).toBe(true);
    expect(result.receipts).toBe(0);
    expect(result.trips).toBe(0);
  });

  it('rejects null input', () => {
    const result = validateBackup(null);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not a JSON object/);
  });

  it('rejects non-object input', () => {
    const result = validateBackup('string');
    expect(result.valid).toBe(false);
  });

  it('rejects missing version', () => {
    const result = validateBackup({ receipts: [], trips: [] });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/missing version/);
  });

  it('rejects when receipts is not an array', () => {
    const result = validateBackup({ version: '1.0.0', receipts: 'bad', trips: [] });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/receipts must be an array/);
  });

  it('rejects when trips is not an array', () => {
    const result = validateBackup({ version: '1.0.0', receipts: [], trips: {} });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/trips must be an array/);
  });

  it('rejects receipt with bad structure', () => {
    const result = validateBackup({
      version: '1.0.0',
      receipts: [{ vendor: 'Shell' }],
      trips: [],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/receipts have unexpected format/);
  });

  it('rejects trip with bad structure', () => {
    const result = validateBackup({
      version: '1.0.0',
      receipts: [],
      trips: [{ destination: 'Airport' }],
    });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/trips have unexpected format/);
  });

  it('rejects receipt missing expense.amount as number', () => {
    const result = validateBackup({
      version: '1.0.0',
      receipts: [{ id: 'r1', expense: { amount: 'bad' } }],
      trips: [],
    });
    expect(result.valid).toBe(false);
  });

  it('accepts backup with multiple receipts and trips', () => {
    const multi = {
      ...validBackup,
      receipts: [validBackup.receipts[0], { ...validBackup.receipts[0], id: 'receipt_002' }],
      trips: [validBackup.trips[0], { ...validBackup.trips[0], id: 'trip_002' }],
    };
    const result = validateBackup(multi);
    expect(result.valid).toBe(true);
    expect(result.receipts).toBe(2);
    expect(result.trips).toBe(2);
  });
});
