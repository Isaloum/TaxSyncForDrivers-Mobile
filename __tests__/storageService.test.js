import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
  getReceiptsByCategory,
  addTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getSettings,
  saveSettings,
} from '../src/services/storageService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('storageService — Receipts', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    // Mark as already migrated to skip migration logic
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      return Promise.resolve(null);
    });
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('returns empty array when no receipts exist', async () => {
    const data = await getReceipts();
    expect(data).toEqual([]);
  });

  it('returns empty array on corrupt JSON', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      if (key === 'taxsync_receipts') return Promise.resolve('not-json!!!');
      return Promise.resolve(null);
    });
    const data = await getReceipts();
    expect(data).toEqual([]);
  });

  it('adds a receipt with correct data model', async () => {
    const receipt = await addReceipt({
      amount: 85.5,
      date: '2026-02-08',
      vendor: 'Shell',
      category: 'fuel',
      description: 'Gas for delivery',
    });

    expect(receipt.id).toMatch(/^receipt-/);
    expect(receipt.expense.amount).toBe(85.5);
    expect(receipt.expense.vendor).toBe('Shell');
    expect(receipt.expense.category).toBe('fuel');
    expect(receipt.expense.date).toBe('2026-02-08');
    expect(receipt.metadata.retainUntil).toBeDefined();
    expect(receipt.metadata.auditStatus).toBe('active');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('generates unique IDs on rapid calls', async () => {
    const r1 = await addReceipt({ amount: 10, date: '2026-01-01' });
    const r2 = await addReceipt({ amount: 20, date: '2026-01-02' });
    expect(r1.id).not.toBe(r2.id);
  });

  it('updates a receipt expense fields', async () => {
    const stored = [
      {
        id: 'receipt-test-1',
        timestamp: '2026-02-08T00:00:00.000Z',
        expense: { date: '2026-02-08', amount: 50, vendor: 'Old', category: 'fuel', description: '' },
        metadata: { uploadedAt: '2026-02-08T00:00:00.000Z', retainUntil: '2032-12-31T00:00:00.000Z', auditStatus: 'active' },
      },
    ];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      if (key === 'taxsync_receipts') return Promise.resolve(JSON.stringify(stored));
      return Promise.resolve(null);
    });

    const updated = await updateReceipt('receipt-test-1', { vendor: 'New Vendor', amount: 75 });
    expect(updated.expense.vendor).toBe('New Vendor');
    expect(updated.expense.amount).toBe(75);
    expect(updated.expense.category).toBe('fuel');
  });

  it('throws on update with non-existent ID', async () => {
    await expect(updateReceipt('non-existent', { amount: 10 })).rejects.toThrow('Receipt not found');
  });

  it('deletes a receipt', async () => {
    const stored = [
      {
        id: 'receipt-del-1',
        timestamp: '2026-02-08T00:00:00.000Z',
        expense: { date: '2026-02-08', amount: 30, vendor: '', category: 'other', description: '' },
        metadata: { uploadedAt: '2026-02-08T00:00:00.000Z', retainUntil: '2032-12-31T00:00:00.000Z', auditStatus: 'active' },
      },
    ];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      if (key === 'taxsync_receipts') return Promise.resolve(JSON.stringify(stored));
      return Promise.resolve(null);
    });

    const result = await deleteReceipt('receipt-del-1');
    expect(result).toBe(true);
  });

  it('returns false when deleting non-existent receipt', async () => {
    const result = await deleteReceipt('non-existent');
    expect(result).toBe(false);
  });

  it('filters receipts by category', async () => {
    const stored = [
      { id: 'r1', timestamp: '', expense: { date: '2026-01-01', amount: 10, vendor: '', category: 'fuel', description: '' }, metadata: {} },
      { id: 'r2', timestamp: '', expense: { date: '2026-01-02', amount: 20, vendor: '', category: 'office', description: '' }, metadata: {} },
      { id: 'r3', timestamp: '', expense: { date: '2026-01-03', amount: 30, vendor: '', category: 'fuel', description: '' }, metadata: {} },
    ];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      if (key === 'taxsync_receipts') return Promise.resolve(JSON.stringify(stored));
      return Promise.resolve(null);
    });

    const fuelReceipts = await getReceiptsByCategory('fuel');
    expect(fuelReceipts).toHaveLength(2);
  });
});

describe('storageService — Mileage', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      return Promise.resolve(null);
    });
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('returns empty array when no trips exist', async () => {
    const data = await getTrips();
    expect(data).toEqual([]);
  });

  it('adds a trip with calculated distance', async () => {
    const trip = await addTrip({
      date: '2026-02-08',
      destination: 'Client office',
      purpose: 'Meeting',
      startOdometer: 10000,
      endOdometer: 10042,
      isBusinessTrip: true,
      clientName: 'Uber',
    });

    expect(trip.id).toMatch(/^trip-/);
    expect(trip.distance).toBe(42);
    expect(trip.isBusinessTrip).toBe(true);
    expect(trip.destination).toBe('Client office');
  });

  it('updates a trip and recalculates distance', async () => {
    const stored = [
      {
        id: 'trip-test-1',
        date: '2026-02-08',
        destination: 'Office',
        purpose: 'Work',
        startOdometer: 10000,
        endOdometer: 10050,
        distance: 50,
        isBusinessTrip: true,
        clientName: '',
        notes: '',
        createdAt: '2026-02-08T00:00:00.000Z',
      },
    ];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      if (key === 'taxsync_mileage_log') return Promise.resolve(JSON.stringify(stored));
      return Promise.resolve(null);
    });

    const updated = await updateTrip('trip-test-1', {
      endOdometer: 10080,
    });
    expect(updated.distance).toBe(80);
  });

  it('deletes a trip', async () => {
    const stored = [
      {
        id: 'trip-del-1',
        date: '2026-02-08',
        destination: 'X',
        purpose: 'Y',
        startOdometer: 0,
        endOdometer: 10,
        distance: 10,
        isBusinessTrip: false,
        clientName: '',
        notes: '',
        createdAt: '2026-02-08T00:00:00.000Z',
      },
    ];
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_migrated_v1') return Promise.resolve('true');
      if (key === 'taxsync_mileage_log') return Promise.resolve(JSON.stringify(stored));
      return Promise.resolve(null);
    });

    const result = await deleteTrip('trip-del-1');
    expect(result).toBe(true);
  });
});

describe('storageService — Settings', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
    AsyncStorage.getItem.mockImplementation(() => Promise.resolve(null));
    AsyncStorage.setItem.mockResolvedValue(undefined);
  });

  it('returns default settings when none saved', async () => {
    const settings = await getSettings();
    expect(settings.province).toBe('QC');
    expect(settings.language).toBe('en');
  });

  it('merges saved settings with defaults', async () => {
    AsyncStorage.getItem.mockImplementation((key) => {
      if (key === 'taxsync_settings')
        return Promise.resolve(JSON.stringify({ province: 'ON', language: 'en' }));
      return Promise.resolve(null);
    });

    const updated = await saveSettings({ language: 'fr' });
    expect(updated.province).toBe('ON');
    expect(updated.language).toBe('fr');
  });
});
