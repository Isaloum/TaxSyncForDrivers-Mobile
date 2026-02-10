import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/generateId';
import { LEGACY_CATEGORY_MAP, RETENTION_YEARS } from '../constants/categories';

const RECEIPTS_KEY = 'taxsync_receipts';
const MILEAGE_KEY = 'taxsync_mileage_log';
const SETTINGS_KEY = 'taxsync_settings';
const OLD_RECEIPTS_KEY = 'receipts';
const MIGRATED_KEY = 'taxsync_migrated_v1';

// --- Internal helpers ---

async function safeGetItem(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function safeSetItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function calculateRetentionDate(expenseDate) {
  const date = new Date(expenseDate);
  const taxYearEnd = new Date(date.getFullYear(), 11, 31);
  taxYearEnd.setFullYear(taxYearEnd.getFullYear() + RETENTION_YEARS);
  return taxYearEnd.toISOString();
}

// --- Data migration ---

async function migrateIfNeeded() {
  const migrated = await AsyncStorage.getItem(MIGRATED_KEY);
  if (migrated) return;

  const oldData = await safeGetItem(OLD_RECEIPTS_KEY);
  if (oldData && Array.isArray(oldData) && oldData.length > 0) {
    const newReceipts = oldData.map((r) => ({
      id: r.id || generateId('receipt'),
      timestamp: r.timestamp || new Date().toISOString(),
      expense: {
        date: r.date || new Date().toISOString().split('T')[0],
        amount: Number(r.amount) || 0,
        vendor: r.vendor || '',
        category: LEGACY_CATEGORY_MAP[r.category] || r.category || 'other',
        description: r.notes || '',
      },
      metadata: {
        uploadedAt: new Date().toISOString(),
        retainUntil: calculateRetentionDate(r.date || new Date()),
        auditStatus: 'active',
      },
    }));
    await safeSetItem(RECEIPTS_KEY, newReceipts);
  }

  await AsyncStorage.setItem(MIGRATED_KEY, 'true');
}

// --- Receipts ---

export async function getReceipts() {
  await migrateIfNeeded();
  const data = await safeGetItem(RECEIPTS_KEY);
  if (!Array.isArray(data)) return [];
  return data.sort(
    (a, b) => new Date(b.expense.date) - new Date(a.expense.date)
  );
}

export async function getReceiptById(id) {
  const receipts = await getReceipts();
  return receipts.find((r) => r.id === id) || null;
}

export async function addReceipt(receiptData) {
  const receipts = await getReceipts();
  const now = new Date().toISOString();
  const expenseDate = receiptData.date || now.split('T')[0];

  const newReceipt = {
    id: generateId('receipt'),
    timestamp: now,
    expense: {
      date: expenseDate,
      amount: Number(receiptData.amount) || 0,
      vendor: receiptData.vendor || '',
      category: receiptData.category || 'other',
      description: receiptData.description || receiptData.notes || '',
    },
    metadata: {
      uploadedAt: now,
      retainUntil: calculateRetentionDate(expenseDate),
      auditStatus: 'active',
      photoUri: receiptData.photoUri || null,
    },
  };

  const updated = [newReceipt, ...receipts];
  const success = await safeSetItem(RECEIPTS_KEY, updated);
  if (!success) throw new Error('Failed to save receipt');
  return newReceipt;
}

export async function updateReceipt(id, updates) {
  const receipts = await getReceipts();
  const index = receipts.findIndex((r) => r.id === id);
  if (index === -1) throw new Error('Receipt not found');

  const existing = receipts[index];
  receipts[index] = {
    ...existing,
    expense: { ...existing.expense, ...updates },
    metadata: { ...existing.metadata, updatedAt: new Date().toISOString() },
  };

  const success = await safeSetItem(RECEIPTS_KEY, receipts);
  if (!success) throw new Error('Failed to update receipt');
  return receipts[index];
}

export async function deleteReceipt(id) {
  const receipts = await getReceipts();
  const filtered = receipts.filter((r) => r.id !== id);
  if (filtered.length === receipts.length) return false;
  const success = await safeSetItem(RECEIPTS_KEY, filtered);
  return success;
}

export async function getReceiptsByCategory(category) {
  const receipts = await getReceipts();
  return receipts.filter((r) => r.expense.category === category);
}

export async function getReceiptsByYear(year) {
  const receipts = await getReceipts();
  return receipts.filter((r) => new Date(r.expense.date).getFullYear() === year);
}

// --- Mileage Trips ---

export async function getTrips() {
  const data = await safeGetItem(MILEAGE_KEY);
  if (!Array.isArray(data)) return [];
  return data.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getTripById(id) {
  const trips = await getTrips();
  return trips.find((t) => t.id === id) || null;
}

export async function addTrip(tripData) {
  const trips = await getTrips();
  const startOdo = Number(tripData.startOdometer);
  const endOdo = Number(tripData.endOdometer);

  const newTrip = {
    id: generateId('trip'),
    date: tripData.date || new Date().toISOString().split('T')[0],
    destination: tripData.destination || '',
    purpose: tripData.purpose || '',
    startOdometer: startOdo,
    endOdometer: endOdo,
    distance: endOdo - startOdo,
    isBusinessTrip: tripData.isBusinessTrip !== false,
    clientName: tripData.clientName || '',
    notes: tripData.notes || '',
    createdAt: new Date().toISOString(),
  };

  const updated = [newTrip, ...trips];
  const success = await safeSetItem(MILEAGE_KEY, updated);
  if (!success) throw new Error('Failed to save trip');
  return newTrip;
}

export async function updateTrip(id, updates) {
  const trips = await getTrips();
  const index = trips.findIndex((t) => t.id === id);
  if (index === -1) throw new Error('Trip not found');

  const existing = trips[index];
  const merged = { ...existing, ...updates };

  if (updates.startOdometer !== undefined || updates.endOdometer !== undefined) {
    merged.distance = Number(merged.endOdometer) - Number(merged.startOdometer);
  }

  trips[index] = merged;
  const success = await safeSetItem(MILEAGE_KEY, trips);
  if (!success) throw new Error('Failed to update trip');
  return trips[index];
}

export async function deleteTrip(id) {
  const trips = await getTrips();
  const filtered = trips.filter((t) => t.id !== id);
  if (filtered.length === trips.length) return false;
  const success = await safeSetItem(MILEAGE_KEY, filtered);
  return success;
}

// --- Settings ---

export async function getSettings() {
  const data = await safeGetItem(SETTINGS_KEY);
  return data || { province: 'QC', language: 'en' };
}

export async function saveSettings(settings) {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  const success = await safeSetItem(SETTINGS_KEY, updated);
  if (!success) throw new Error('Failed to save settings');
  return updated;
}
