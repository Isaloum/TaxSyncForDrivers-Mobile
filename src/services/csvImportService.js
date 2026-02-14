/**
 * CSV Import Service — Parse Uber & Lyft driver CSV exports
 *
 * Supports:
 *  - Uber Driver Tax Summary CSV (trips & earnings)
 *  - Lyft Driver Ride History CSV
 *  - Generic CSV with auto-detection
 *
 * Converts imported data to TaxSync receipt and trip formats.
 */

import { generateId } from '../utils/generateId';
import { RETENTION_YEARS } from '../constants/categories';

// ─── CSV Parser ─────────────────────────────────────────────

/**
 * Parse raw CSV text into an array of objects.
 * Handles quoted fields, commas within quotes, and CRLF/LF line endings.
 *
 * @param {string} csvText - Raw CSV content
 * @returns {{ headers: string[], rows: Object[] }}
 */
export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') {
    return { headers: [], rows: [] };
  }

  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx]?.trim() || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line respecting quoted fields.
 * @param {string} line
 * @returns {string[]}
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// ─── Platform Detection ─────────────────────────────────────

/**
 * Detect the CSV platform based on headers.
 * @param {string[]} headers
 * @returns {'uber' | 'lyft' | 'generic'}
 */
export function detectPlatform(headers) {
  const normalized = headers.map(h => h.toLowerCase().trim());

  // Uber: "Trip or Order UUID", "Driver Payment", "Trip Distance"
  const uberMarkers = ['trip or order uuid', 'driver payment', 'begin trip time'];
  if (uberMarkers.some(m => normalized.includes(m))) return 'uber';

  // Uber alternative: "Date/Time", "Gross Fare", "Distance (miles)"
  if (normalized.includes('gross fare') || normalized.includes('uber service')) return 'uber';

  // Lyft: "Ride ID", "Ride Distance (mi)", "Ride Earnings"
  const lyftMarkers = ['ride id', 'ride type', 'ride earnings'];
  if (lyftMarkers.some(m => normalized.includes(m))) return 'lyft';

  // Lyft alternative: "Date", "Driver Earnings"
  if (normalized.includes('driver earnings') && normalized.includes('ride distance')) return 'lyft';

  return 'generic';
}

// ─── Uber CSV Parsing ───────────────────────────────────────

/**
 * Parse Uber driver CSV rows into TaxSync trips.
 * @param {Object[]} rows - Parsed CSV rows
 * @returns {{ trips: Object[], receipts: Object[], summary: Object }}
 */
export function parseUberCSV(rows) {
  const trips = [];
  const receipts = [];
  let totalEarnings = 0;
  let totalDistance = 0;

  for (const row of rows) {
    // Extract date
    const dateStr = row['Begin Trip Time'] || row['Date/Time'] || row['Date'] || '';
    const date = parseFlexDate(dateStr);
    if (!date) continue;

    // Extract distance (Uber reports in miles, convert to km)
    const distanceMiles = parseNumber(
      row['Trip Distance'] || row['Distance (miles)'] || row['Trip or Order Distance'] || '0'
    );
    const distanceKm = Math.round(distanceMiles * 1.60934 * 10) / 10;

    // Extract earnings
    const earnings = parseNumber(
      row['Driver Payment'] || row['Gross Fare'] || row['Your Earnings'] || row['Total'] || '0'
    );

    // Trip destination
    const destination = row['Dropoff Address'] || row['Dropoff'] || row['City'] || 'Uber Trip';
    const purpose = row['Trip Type'] || row['Uber Service'] || 'Rideshare';

    if (distanceKm > 0) {
      trips.push({
        id: generateId('trip'),
        date,
        destination: truncate(destination, 60),
        purpose: truncate(purpose, 40),
        startOdometer: 0,
        endOdometer: distanceKm,
        distance: distanceKm,
        isBusinessTrip: true,
        type: 'business',
        clientName: 'Uber',
        notes: `Imported from Uber CSV`,
        createdAt: new Date().toISOString(),
        source: 'uber-csv',
      });
      totalDistance += distanceKm;
    }

    if (earnings > 0) {
      receipts.push({
        id: generateId('receipt'),
        timestamp: new Date().toISOString(),
        expense: {
          date,
          amount: earnings,
          vendor: 'Uber',
          category: 'other',
          description: `Uber earnings — ${purpose}`,
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          retainUntil: calculateRetentionDate(date),
          auditStatus: 'active',
          source: 'uber-csv',
        },
      });
      totalEarnings += earnings;
    }
  }

  return {
    trips,
    receipts,
    summary: {
      platform: 'Uber',
      totalTrips: trips.length,
      totalReceipts: receipts.length,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
    },
  };
}

// ─── Lyft CSV Parsing ───────────────────────────────────────

/**
 * Parse Lyft driver CSV rows into TaxSync trips.
 * @param {Object[]} rows - Parsed CSV rows
 * @returns {{ trips: Object[], receipts: Object[], summary: Object }}
 */
export function parseLyftCSV(rows) {
  const trips = [];
  const receipts = [];
  let totalEarnings = 0;
  let totalDistance = 0;

  for (const row of rows) {
    // Extract date
    const dateStr = row['Date'] || row['Ride Date'] || row['Pickup Time'] || '';
    const date = parseFlexDate(dateStr);
    if (!date) continue;

    // Extract distance (Lyft reports in miles)
    const distanceMiles = parseNumber(
      row['Ride Distance (mi)'] || row['Ride Distance'] || row['Distance (mi)'] || '0'
    );
    const distanceKm = Math.round(distanceMiles * 1.60934 * 10) / 10;

    // Extract earnings
    const earnings = parseNumber(
      row['Ride Earnings'] || row['Driver Earnings'] || row['Total Earnings'] || row['Earnings'] || '0'
    );

    // Trip details
    const destination = row['Dropoff Location'] || row['Dropoff Address'] || row['Dropoff'] || 'Lyft Trip';
    const rideType = row['Ride Type'] || 'Lyft Ride';

    if (distanceKm > 0) {
      trips.push({
        id: generateId('trip'),
        date,
        destination: truncate(destination, 60),
        purpose: truncate(rideType, 40),
        startOdometer: 0,
        endOdometer: distanceKm,
        distance: distanceKm,
        isBusinessTrip: true,
        type: 'business',
        clientName: 'Lyft',
        notes: `Imported from Lyft CSV`,
        createdAt: new Date().toISOString(),
        source: 'lyft-csv',
      });
      totalDistance += distanceKm;
    }

    if (earnings > 0) {
      receipts.push({
        id: generateId('receipt'),
        timestamp: new Date().toISOString(),
        expense: {
          date,
          amount: earnings,
          vendor: 'Lyft',
          category: 'other',
          description: `Lyft earnings — ${rideType}`,
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          retainUntil: calculateRetentionDate(date),
          auditStatus: 'active',
          source: 'lyft-csv',
        },
      });
      totalEarnings += earnings;
    }
  }

  return {
    trips,
    receipts,
    summary: {
      platform: 'Lyft',
      totalTrips: trips.length,
      totalReceipts: receipts.length,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
    },
  };
}

// ─── Generic CSV Parsing ────────────────────────────────────

/**
 * Try to parse a generic CSV into trips (best-effort column matching).
 * @param {Object[]} rows
 * @param {string[]} headers
 * @returns {{ trips: Object[], receipts: Object[], summary: Object }}
 */
export function parseGenericCSV(rows, headers) {
  const normalized = headers.map(h => h.toLowerCase().trim());

  // Find column indices by common names
  const dateCol = findColumn(normalized, ['date', 'trip date', 'datetime', 'time', 'start time']);
  const distanceCol = findColumn(normalized, ['distance', 'km', 'miles', 'trip distance', 'ride distance']);
  const amountCol = findColumn(normalized, ['amount', 'total', 'earnings', 'fare', 'payment', 'cost']);
  const vendorCol = findColumn(normalized, ['vendor', 'merchant', 'source', 'platform', 'company']);
  const destinationCol = findColumn(normalized, ['destination', 'dropoff', 'address', 'location', 'to']);
  const purposeCol = findColumn(normalized, ['purpose', 'type', 'ride type', 'trip type', 'category']);

  const trips = [];
  const receipts = [];
  let totalEarnings = 0;
  let totalDistance = 0;

  for (const row of rows) {
    const values = Object.values(row);
    const dateStr = dateCol !== -1 ? values[dateCol] : '';
    const date = parseFlexDate(dateStr);
    if (!date) continue;

    const distanceVal = distanceCol !== -1 ? parseNumber(values[distanceCol]) : 0;
    const amountVal = amountCol !== -1 ? parseNumber(values[amountCol]) : 0;
    const vendor = vendorCol !== -1 ? values[vendorCol] : 'CSV Import';
    const destination = destinationCol !== -1 ? values[destinationCol] : '';
    const purpose = purposeCol !== -1 ? values[purposeCol] : '';

    if (distanceVal > 0) {
      trips.push({
        id: generateId('trip'),
        date,
        destination: truncate(destination || 'Imported Trip', 60),
        purpose: truncate(purpose, 40),
        startOdometer: 0,
        endOdometer: distanceVal,
        distance: distanceVal,
        isBusinessTrip: true,
        type: 'business',
        clientName: vendor,
        notes: 'Imported from CSV',
        createdAt: new Date().toISOString(),
        source: 'generic-csv',
      });
      totalDistance += distanceVal;
    }

    if (amountVal > 0) {
      receipts.push({
        id: generateId('receipt'),
        timestamp: new Date().toISOString(),
        expense: {
          date,
          amount: amountVal,
          vendor: vendor || 'CSV Import',
          category: 'other',
          description: purpose || 'Imported from CSV',
        },
        metadata: {
          uploadedAt: new Date().toISOString(),
          retainUntil: calculateRetentionDate(date),
          auditStatus: 'active',
          source: 'generic-csv',
        },
      });
      totalEarnings += amountVal;
    }
  }

  return {
    trips,
    receipts,
    summary: {
      platform: 'CSV',
      totalTrips: trips.length,
      totalReceipts: receipts.length,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalDistanceKm: Math.round(totalDistance * 10) / 10,
    },
  };
}

// ─── Main Import Function ───────────────────────────────────

/**
 * Parse a CSV file and return structured import data.
 * Auto-detects Uber, Lyft, or generic CSV format.
 *
 * @param {string} csvText - Raw CSV content
 * @returns {{ trips: Object[], receipts: Object[], summary: Object }}
 */
export function importCSV(csvText) {
  const { headers, rows } = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      trips: [],
      receipts: [],
      summary: { platform: 'Unknown', totalTrips: 0, totalReceipts: 0, totalEarnings: 0, totalDistanceKm: 0 },
    };
  }

  const platform = detectPlatform(headers);

  switch (platform) {
    case 'uber':
      return parseUberCSV(rows);
    case 'lyft':
      return parseLyftCSV(rows);
    default:
      return parseGenericCSV(rows, headers);
  }
}

// ─── Utility Helpers ────────────────────────────────────────

/**
 * Find a column index by trying multiple possible header names.
 */
function findColumn(normalizedHeaders, candidates) {
  for (const candidate of candidates) {
    const idx = normalizedHeaders.indexOf(candidate);
    if (idx !== -1) return idx;
  }
  // Partial match
  for (const candidate of candidates) {
    const idx = normalizedHeaders.findIndex(h => h.includes(candidate));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Parse a number from a string, removing $ and , characters.
 */
function parseNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[$,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a date string in various formats → YYYY-MM-DD.
 */
export function parseFlexDate(str) {
  if (!str) return null;
  const s = String(str).trim();

  // ISO: 2026-01-15 or 2026-01-15T10:30:00
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // MM/DD/YYYY or M/D/YYYY
  const mdyMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdyMatch) {
    const m = mdyMatch[1].padStart(2, '0');
    const d = mdyMatch[2].padStart(2, '0');
    return `${mdyMatch[3]}-${m}-${d}`;
  }

  // DD/MM/YYYY (try if first number > 12, otherwise ambiguous, assume MM/DD)
  // Already handled above as MM/DD/YYYY

  // "Jan 15, 2026" or "January 15, 2026"
  const monthNames = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const namedMatch = s.match(/^(\w{3,})\s+(\d{1,2}),?\s+(\d{4})/i);
  if (namedMatch) {
    const mKey = namedMatch[1].slice(0, 3).toLowerCase();
    if (monthNames[mKey]) {
      return `${namedMatch[3]}-${monthNames[mKey]}-${namedMatch[2].padStart(2, '0')}`;
    }
  }

  // Fallback: try Date.parse
  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Truncate a string to maxLen characters.
 */
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/**
 * Calculate CRA retention date (6 years from tax year end).
 */
function calculateRetentionDate(expenseDate) {
  const date = new Date(expenseDate);
  const taxYearEnd = new Date(date.getFullYear(), 11, 31);
  taxYearEnd.setFullYear(taxYearEnd.getFullYear() + RETENTION_YEARS);
  return taxYearEnd.toISOString();
}
