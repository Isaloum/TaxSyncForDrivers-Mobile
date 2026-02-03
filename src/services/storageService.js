import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'receipts';

/**
 * Get all receipts.
 */
export async function getReceipts() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Add a receipt.
 */
export async function addReceipt(receipt) {
  const receipts = await getReceipts();
  const newReceipt = {
    id: String(Date.now()),
    ...receipt,
  };
  const updated = [newReceipt, ...receipts];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return newReceipt;
}
