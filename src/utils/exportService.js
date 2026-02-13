import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getReceipts, getTrips, replaceAllReceipts, replaceAllTrips } from '../services/storageService';
import { RECEIPT_CATEGORIES } from '../constants/categories';

function getCategoryLabel(key) {
  const cat = RECEIPT_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.label : key || 'Other';
}

function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export receipts to CSV and share.
 */
export async function exportReceiptsCSV() {
  const receipts = await getReceipts();
  if (!receipts.length) throw new Error('No receipts to export.');

  const headers = ['Date', 'Amount', 'Vendor', 'Category', 'Description', 'Retain Until'];
  const rows = receipts.map((r) => [
    escapeCSV(r.expense.date),
    escapeCSV(r.expense.amount?.toFixed(2)),
    escapeCSV(r.expense.vendor),
    escapeCSV(getCategoryLabel(r.expense.category)),
    escapeCSV(r.expense.description),
    escapeCSV(r.metadata?.retainUntil ? new Date(r.metadata.retainUntil).toLocaleDateString() : ''),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const filename = `taxsync_receipts_${new Date().toISOString().split('T')[0]}.csv`;
  const path = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(path, csv);
  await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Receipts' });

  return { path, count: receipts.length };
}

/**
 * Export mileage trips to CSV and share.
 */
export async function exportMileageCSV() {
  const trips = await getTrips();
  if (!trips.length) throw new Error('No trips to export.');

  const headers = ['Date', 'Destination', 'Purpose', 'Start Odo', 'End Odo', 'Distance (km)', 'Type', 'Client'];
  const rows = trips.map((t) => [
    escapeCSV(t.date),
    escapeCSV(t.destination),
    escapeCSV(t.purpose),
    escapeCSV(t.startOdometer),
    escapeCSV(t.endOdometer),
    escapeCSV(t.distance),
    escapeCSV(t.isBusinessTrip ? 'Business' : 'Personal'),
    escapeCSV(t.clientName),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const filename = `taxsync_mileage_${new Date().toISOString().split('T')[0]}.csv`;
  const path = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(path, csv);
  await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Mileage' });

  return { path, count: trips.length };
}

/**
 * Export all data as JSON backup and share.
 */
export async function exportBackupJSON() {
  const [receipts, trips] = await Promise.all([getReceipts(), getTrips()]);

  const backup = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    receipts,
    trips,
  };

  const json = JSON.stringify(backup, null, 2);
  const filename = `taxsync_backup_${new Date().toISOString().split('T')[0]}.json`;
  const path = `${FileSystem.documentDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(path, json);
  await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export Backup' });

  return { path, receipts: receipts.length, trips: trips.length };
}

/**
 * Validate a backup JSON object has the expected structure.
 */
export function validateBackup(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid file: not a JSON object.' };
  }
  if (!data.version || typeof data.version !== 'string') {
    return { valid: false, error: 'Invalid backup: missing version.' };
  }
  if (!Array.isArray(data.receipts)) {
    return { valid: false, error: 'Invalid backup: receipts must be an array.' };
  }
  if (!Array.isArray(data.trips)) {
    return { valid: false, error: 'Invalid backup: trips must be an array.' };
  }
  // Validate receipt structure (spot check first item)
  if (data.receipts.length > 0) {
    const r = data.receipts[0];
    if (!r.id || !r.expense || typeof r.expense.amount !== 'number') {
      return { valid: false, error: 'Invalid backup: receipts have unexpected format.' };
    }
  }
  // Validate trip structure (spot check first item)
  if (data.trips.length > 0) {
    const t = data.trips[0];
    if (!t.id || typeof t.distance !== 'number') {
      return { valid: false, error: 'Invalid backup: trips have unexpected format.' };
    }
  }
  return { valid: true, receipts: data.receipts.length, trips: data.trips.length };
}

/**
 * Pick a JSON backup file and restore data.
 * Returns { receipts, trips } count on success.
 */
export async function importBackupJSON() {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) {
    return null; // User cancelled
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) {
    throw new Error('No file selected.');
  }

  const content = await FileSystem.readAsStringAsync(asset.uri);
  let data;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('Invalid file: could not parse JSON.');
  }

  const validation = validateBackup(data);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  await replaceAllReceipts(data.receipts);
  await replaceAllTrips(data.trips);

  return { receipts: data.receipts.length, trips: data.trips.length };
}
