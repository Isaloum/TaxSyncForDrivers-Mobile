/**
 * OCR Service — Receipt text parsing and data extraction
 *
 * Provides regex-based receipt parsing to extract:
 *  - Total amount ($)
 *  - Date (various formats)
 *  - Vendor/store name
 *  - Tax amounts (GST/HST/QST/TPS/TVQ)
 *  - Suggested CRA category
 *
 * Works offline — no cloud API needed.
 * In production, integrate with Google ML Kit or Tesseract for real OCR.
 * This service handles the parsing layer once raw text is available.
 */

import { RECEIPT_CATEGORIES } from '../constants/categories';

// ─── Amount extraction ───────────────────────────────────────
const AMOUNT_PATTERNS = [
  /(?:grand total|balance due|amount due)\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i,
  /^TOTAL\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/im,
  /(?:^|\n)\s*total\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/im,
  /(?:amount|montant|prix)\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i,
  /(\d{1,6}[.,]\d{2})\s*(?:CAD|CDN)/i,
];

/**
 * Extract total amount from receipt text
 * @param {string} text - Raw receipt text
 * @returns {number|null} - Extracted amount or null
 */
export function extractAmount(text) {
  if (!text) return null;

  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (value > 0 && value < 100000) return value;
    }
  }

  // Fallback: find all dollar amounts and return the largest (likely the total)
  const allAmounts = [];
  const globalPattern = /\$\s*(\d{1,6}[.,]\d{2})/g;
  let m;
  while ((m = globalPattern.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(',', '.'));
    if (val > 0 && val < 100000) allAmounts.push(val);
  }

  if (allAmounts.length > 0) {
    return Math.max(...allAmounts);
  }

  return null;
}

// ─── Date extraction ─────────────────────────────────────────
const DATE_PATTERNS = [
  // YYYY-MM-DD or YYYY/MM/DD
  /(\d{4})[/-](\d{1,2})[/-](\d{1,2})/,
  // DD/MM/YYYY or DD-MM-YYYY
  /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/,
  // MM/DD/YYYY (US style)
  /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/,
  // Month DD, YYYY (e.g., "Jan 15, 2026")
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2}),?\s+(\d{4})/i,
  // DD Month YYYY (e.g., "15 January 2026")
  /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{4})/i,
];

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Extract date from receipt text
 * @param {string} text - Raw receipt text
 * @returns {string|null} - Date in YYYY-MM-DD format or null
 */
export function extractDate(text) {
  if (!text) return null;

  // Try YYYY-MM-DD first
  let match = text.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    const date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (isValidDate(date)) return date;
  }

  // Try "Month DD, YYYY"
  match = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (match) {
    const monthNum = MONTH_MAP[match[1].toLowerCase().substring(0, 3)];
    const date = `${match[3]}-${monthNum}-${match[2].padStart(2, '0')}`;
    if (isValidDate(date)) return date;
  }

  // Try "DD Month YYYY"
  match = text.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{4})/i);
  if (match) {
    const monthNum = MONTH_MAP[match[2].toLowerCase().substring(0, 3)];
    const date = `${match[3]}-${monthNum}-${match[1].padStart(2, '0')}`;
    if (isValidDate(date)) return date;
  }

  // Try DD/MM/YYYY
  match = text.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (match) {
    const [, a, b, y] = match;
    // Assume DD/MM/YYYY for Canadian receipts
    const date = `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    if (isValidDate(date)) return date;
    // Try MM/DD/YYYY
    const date2 = `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
    if (isValidDate(date2)) return date2;
  }

  return null;
}

function isValidDate(dateStr) {
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d) && d.getFullYear() >= 2020 && d.getFullYear() <= 2030;
}

// ─── Vendor extraction ───────────────────────────────────────
const KNOWN_VENDORS = [
  // Gas stations
  { patterns: ['shell', 'petro-canada', 'petro canada', 'petrocan', 'esso', 'ultramar', 'irving', 'pioneer', 'costco gas', 'canadian tire gas'], category: 'fuel' },
  // Car maintenance
  { patterns: ['canadian tire', 'midas', 'mr lube', 'jiffy lube', 'napa', 'autozone', 'lordco'], category: 'maintenance' },
  // Insurance
  { patterns: ['intact', 'desjardins', 'aviva', 'wawanesa', 'td insurance', 'belair'], category: 'insurance' },
  // Office supplies
  { patterns: ['staples', 'bureau en gros', 'dollarama', 'dollar tree', 'amazon'], category: 'office' },
  // Telecom
  { patterns: ['bell', 'rogers', 'telus', 'fido', 'koodo', 'virgin mobile', 'freedom mobile', 'videotron'], category: 'telephone' },
  // General stores
  { patterns: ['walmart', 'costco', 'home depot', 'rona', 'lowes', 'home hardware'], category: 'supplies' },
];

/**
 * Extract vendor name from receipt text
 * @param {string} text - Raw receipt text
 * @returns {{ vendor: string|null, category: string|null }}
 */
export function extractVendor(text) {
  if (!text) return { vendor: null, category: null };

  const lowerText = text.toLowerCase();

  // Check known vendors
  for (const group of KNOWN_VENDORS) {
    for (const pattern of group.patterns) {
      if (lowerText.includes(pattern)) {
        // Capitalize vendor name
        const vendor = pattern.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return { vendor, category: group.category };
      }
    }
  }

  // Fallback: use first non-empty line as vendor (common receipt format)
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  if (lines.length > 0) {
    const firstLine = lines[0];
    // Skip if first line looks like a number or date
    if (!/^\d/.test(firstLine) && firstLine.length < 50) {
      return { vendor: firstLine, category: null };
    }
  }

  return { vendor: null, category: null };
}

// ─── Tax extraction ──────────────────────────────────────────
const TAX_PATTERNS = [
  /(?:GST|TPS)\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i,
  /(?:HST|TVH)\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i,
  /(?:QST|TVQ)\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i,
  /(?:PST|TVP)\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i,
  /(?:tax|taxe)\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i,
];

/**
 * Extract tax amounts from receipt text
 * @param {string} text - Raw receipt text
 * @returns {{ gst: number|null, qst: number|null, hst: number|null, totalTax: number|null }}
 */
export function extractTax(text) {
  if (!text) return { gst: null, qst: null, hst: null, totalTax: null };

  let gst = null, qst = null, hst = null;

  const gstMatch = text.match(/(?:GST|TPS)\s*(?:\([^)]*\))?\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i);
  if (gstMatch) gst = parseFloat(gstMatch[1].replace(',', '.'));

  const hstMatch = text.match(/(?:HST|TVH)\s*(?:\([^)]*\))?\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i);
  if (hstMatch) hst = parseFloat(hstMatch[1].replace(',', '.'));

  const qstMatch = text.match(/(?:QST|TVQ)\s*(?:\([^)]*\))?\s*[:=]?\s*\$?\s*(\d{1,6}[.,]\d{2})/i);
  if (qstMatch) qst = parseFloat(qstMatch[1].replace(',', '.'));

  const totalTax = (gst || 0) + (qst || 0) + (hst || 0);

  return { gst, qst, hst, totalTax: totalTax > 0 ? totalTax : null };
}

// ─── Category suggestion ─────────────────────────────────────
const CATEGORY_KEYWORDS = {
  fuel: ['gas', 'fuel', 'diesel', 'petrol', 'carburant', 'essence', 'pump', 'litre', 'liter', 'gallon'],
  maintenance: ['oil change', 'tire', 'brake', 'repair', 'mechanic', 'tow', 'wash', 'entretien', 'pneu'],
  insurance: ['insurance', 'assurance', 'premium', 'policy', 'coverage'],
  supplies: ['supply', 'supplies', 'parts', 'hardware', 'tools', 'fournitures'],
  office: ['office', 'paper', 'ink', 'toner', 'printer', 'bureau', 'stationery'],
  telephone: ['phone', 'mobile', 'wireless', 'data plan', 'cellulaire', 'téléphone'],
  advertising: ['advertising', 'ads', 'marketing', 'promo', 'publicité', 'flyer'],
};

/**
 * Suggest a CRA category based on receipt text
 * @param {string} text - Raw receipt text
 * @returns {string} - Category key from RECEIPT_CATEGORIES
 */
export function suggestCategory(text) {
  if (!text) return 'other';

  const lowerText = text.toLowerCase();

  let bestCategory = 'other';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  return bestCategory;
}

// ─── Full receipt parsing ────────────────────────────────────
/**
 * Parse receipt text and extract all fields
 * @param {string} text - Raw OCR text from receipt
 * @returns {Object} - Parsed receipt data
 */
export function parseReceiptText(text) {
  if (!text || typeof text !== 'string') {
    return {
      amount: null,
      date: null,
      vendor: null,
      category: 'other',
      tax: { gst: null, qst: null, hst: null, totalTax: null },
      confidence: 0,
      rawText: text || '',
    };
  }

  const amount = extractAmount(text);
  const date = extractDate(text);
  const { vendor, category: vendorCategory } = extractVendor(text);
  const textCategory = suggestCategory(text);
  const tax = extractTax(text);

  // Use vendor-matched category if available, otherwise text-based
  const category = vendorCategory || textCategory;

  // Calculate confidence score (0-100)
  let confidence = 0;
  if (amount !== null) confidence += 35;
  if (date !== null) confidence += 25;
  if (vendor !== null) confidence += 20;
  if (category !== 'other') confidence += 10;
  if (tax.totalTax !== null) confidence += 10;

  return {
    amount,
    date: date || new Date().toISOString().split('T')[0],
    vendor: vendor || '',
    category,
    tax,
    confidence,
    rawText: text,
  };
}

// ─── Simulated OCR for demo/testing ──────────────────────────
/**
 * Simulate OCR text extraction from a photo URI
 * In production, replace with Google ML Kit or Tesseract integration
 * @param {string} photoUri - URI of the captured receipt photo
 * @returns {Promise<string>} - Simulated raw OCR text
 */
export async function simulateOCR(photoUri) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Return a sample receipt for demo purposes
  // In production: use ML Kit's TextRecognition or expo-ocr
  return `SHELL CANADA
123 Main Street
Montreal, QC H2X 1A1

Date: ${new Date().toISOString().split('T')[0]}

Regular Unleaded
42.5 L @ $1.65/L

Subtotal          $70.13
GST (5%)           $3.51
QST (9.975%)       $7.00
TOTAL             $80.64

VISA ****1234
Thank you / Merci`;
}
