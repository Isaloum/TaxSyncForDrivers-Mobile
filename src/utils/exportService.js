import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getReceipts, getTrips } from '../services/storageService';
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
