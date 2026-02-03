import AsyncStorage from '@react-native-async-storage/async-storage';
import { addReceipt, getReceipts } from '../src/services/storageService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('storageService', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset();
    AsyncStorage.setItem.mockReset();
  });

  it('returns empty array when no receipts exist', async () => {
    AsyncStorage.getItem.mockResolvedValue(null);
    const data = await getReceipts();
    expect(data).toEqual([]);
  });

  it('adds a receipt with category', async () => {
    AsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));
    const receipt = await addReceipt({
      amount: 25.5,
      date: '2026-02-02',
      category: 'Gas',
      notes: 'Shell',
    });

    expect(receipt.category).toBe('Gas');
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });
});
