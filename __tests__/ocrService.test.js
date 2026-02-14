import {
  extractAmount,
  extractDate,
  extractVendor,
  extractTax,
  suggestCategory,
  parseReceiptText,
  simulateOCR,
} from '../src/services/ocrService';

// ─── extractAmount ───────────────────────────────────────────
describe('extractAmount', () => {
  it('returns null for empty text', () => {
    expect(extractAmount('')).toBeNull();
    expect(extractAmount(null)).toBeNull();
  });

  it('extracts "TOTAL $80.64"', () => {
    expect(extractAmount('TOTAL $80.64')).toBe(80.64);
  });

  it('extracts "Total: $123.45"', () => {
    expect(extractAmount('Total: $123.45')).toBe(123.45);
  });

  it('extracts "Amount Due: 55.99"', () => {
    expect(extractAmount('Amount Due: 55.99')).toBe(55.99);
  });

  it('extracts "Grand Total  $200.00"', () => {
    expect(extractAmount('Grand Total  $200.00')).toBe(200);
  });

  it('extracts amount with comma as decimal', () => {
    expect(extractAmount('Total: $99,50')).toBe(99.5);
  });

  it('extracts "45.99 CAD"', () => {
    expect(extractAmount('45.99 CAD')).toBe(45.99);
  });

  it('extracts largest amount when no label', () => {
    const text = 'Item 1: $5.00\nItem 2: $10.00\n$15.00';
    expect(extractAmount(text)).toBe(15);
  });

  it('extracts "montant: $35.00"', () => {
    expect(extractAmount('montant: $35.00')).toBe(35);
  });
});

// ─── extractDate ─────────────────────────────────────────────
describe('extractDate', () => {
  it('returns null for empty text', () => {
    expect(extractDate('')).toBeNull();
    expect(extractDate(null)).toBeNull();
  });

  it('extracts YYYY-MM-DD format', () => {
    expect(extractDate('Date: 2026-02-13')).toBe('2026-02-13');
  });

  it('extracts YYYY/MM/DD format', () => {
    expect(extractDate('2026/01/15')).toBe('2026-01-15');
  });

  it('extracts "Jan 15, 2026"', () => {
    expect(extractDate('Date: Jan 15, 2026')).toBe('2026-01-15');
  });

  it('extracts "February 3, 2026"', () => {
    expect(extractDate('February 3, 2026')).toBe('2026-02-03');
  });

  it('extracts "15 March 2026"', () => {
    expect(extractDate('15 March 2026')).toBe('2026-03-15');
  });

  it('extracts DD/MM/YYYY format', () => {
    expect(extractDate('13/02/2026')).toBe('2026-02-13');
  });

  it('pads single digit month and day', () => {
    expect(extractDate('2026-1-5')).toBe('2026-01-05');
  });
});

// ─── extractVendor ───────────────────────────────────────────
describe('extractVendor', () => {
  it('returns null for empty text', () => {
    const result = extractVendor('');
    expect(result.vendor).toBeNull();
    expect(result.category).toBeNull();
  });

  it('detects Shell gas station', () => {
    const result = extractVendor('SHELL CANADA\n123 Main St');
    expect(result.vendor).toBe('Shell');
    expect(result.category).toBe('fuel');
  });

  it('detects Petro-Canada', () => {
    const result = extractVendor('Welcome to Petro-Canada');
    expect(result.vendor).toBe('Petro-canada');
    expect(result.category).toBe('fuel');
  });

  it('detects Canadian Tire (maintenance)', () => {
    const result = extractVendor('CANADIAN TIRE AUTO SERVICE');
    expect(result.vendor).toBe('Canadian Tire');
    expect(result.category).toBe('maintenance');
  });

  it('detects Bell (telephone)', () => {
    const result = extractVendor('BELL MOBILITY\nYour Monthly Bill');
    expect(result.vendor).toBe('Bell');
    expect(result.category).toBe('telephone');
  });

  it('uses first line as vendor for unknown stores', () => {
    const result = extractVendor('JOES AUTO SHOP\n123 Street\nTotal: $50.00');
    expect(result.vendor).toBe('JOES AUTO SHOP');
    expect(result.category).toBeNull();
  });
});

// ─── extractTax ──────────────────────────────────────────────
describe('extractTax', () => {
  it('returns nulls for empty text', () => {
    const result = extractTax('');
    expect(result.gst).toBeNull();
    expect(result.qst).toBeNull();
    expect(result.hst).toBeNull();
    expect(result.totalTax).toBeNull();
  });

  it('extracts GST amount', () => {
    const result = extractTax('GST: $3.51');
    expect(result.gst).toBe(3.51);
    expect(result.totalTax).toBe(3.51);
  });

  it('extracts QST amount', () => {
    const result = extractTax('QST: $7.00');
    expect(result.qst).toBe(7);
    expect(result.totalTax).toBe(7);
  });

  it('extracts HST amount', () => {
    const result = extractTax('HST: $10.40');
    expect(result.hst).toBe(10.4);
    expect(result.totalTax).toBe(10.4);
  });

  it('extracts GST + QST together', () => {
    const result = extractTax('GST $3.51\nQST $7.00');
    expect(result.gst).toBe(3.51);
    expect(result.qst).toBe(7);
    expect(result.totalTax).toBe(10.51);
  });

  it('extracts French tax labels TPS/TVQ', () => {
    const result = extractTax('TPS: $2.50\nTVQ: $4.99');
    expect(result.gst).toBe(2.5);
    expect(result.qst).toBe(4.99);
  });
});

// ─── suggestCategory ─────────────────────────────────────────
describe('suggestCategory', () => {
  it('returns other for empty text', () => {
    expect(suggestCategory('')).toBe('other');
    expect(suggestCategory(null)).toBe('other');
  });

  it('suggests fuel for gas-related text', () => {
    expect(suggestCategory('Regular Unleaded Fuel 42.5L')).toBe('fuel');
  });

  it('suggests maintenance for oil change', () => {
    expect(suggestCategory('Oil change and tire rotation')).toBe('maintenance');
  });

  it('suggests telephone for mobile bill', () => {
    expect(suggestCategory('Monthly wireless phone plan')).toBe('telephone');
  });

  it('suggests office for paper supplies', () => {
    expect(suggestCategory('Printer ink and paper')).toBe('office');
  });

  it('suggests insurance for policy payment', () => {
    expect(suggestCategory('Auto insurance premium payment')).toBe('insurance');
  });
});

// ─── parseReceiptText ────────────────────────────────────────
describe('parseReceiptText', () => {
  it('returns defaults for null input', () => {
    const result = parseReceiptText(null);
    expect(result.amount).toBeNull();
    expect(result.vendor).toBeNull();
    expect(result.category).toBe('other');
    expect(result.confidence).toBe(0);
  });

  it('parses a full Shell receipt', () => {
    const text = `SHELL CANADA
123 Main Street
Montreal, QC H2X 1A1

Date: 2026-02-13

Regular Unleaded
42.5 L @ $1.65/L

Subtotal          $70.13
GST (5%)           $3.51
QST (9.975%)       $7.00
TOTAL             $80.64`;

    const result = parseReceiptText(text);
    expect(result.amount).toBe(80.64);
    expect(result.date).toBe('2026-02-13');
    expect(result.vendor).toBe('Shell');
    expect(result.category).toBe('fuel');
    expect(result.tax.gst).toBe(3.51);
    expect(result.tax.qst).toBe(7);
    expect(result.confidence).toBeGreaterThanOrEqual(80);
  });

  it('parses a Bell invoice', () => {
    const text = `BELL MOBILITY
Invoice Date: Jan 5, 2026
Monthly Plan: $65.00
GST: $3.25
Total: $68.25`;

    const result = parseReceiptText(text);
    expect(result.amount).toBe(68.25);
    expect(result.date).toBe('2026-01-05');
    expect(result.vendor).toBe('Bell');
    expect(result.category).toBe('telephone');
    expect(result.tax.gst).toBe(3.25);
  });

  it('calculates confidence score correctly', () => {
    // All fields present
    const full = parseReceiptText('SHELL\n2026-01-01\nTotal $50.00\nGST $2.50');
    expect(full.confidence).toBeGreaterThanOrEqual(80);

    // Only amount
    const partial = parseReceiptText('Total: $50.00');
    expect(partial.confidence).toBeLessThan(full.confidence);
  });

  it('returns rawText in result', () => {
    const text = 'Some receipt text';
    const result = parseReceiptText(text);
    expect(result.rawText).toBe(text);
  });
});

// ─── simulateOCR ─────────────────────────────────────────────
describe('simulateOCR', () => {
  it('returns simulated receipt text', async () => {
    const text = await simulateOCR('file:///test.jpg');
    expect(text).toContain('SHELL');
    expect(text).toContain('TOTAL');
    expect(text).toContain('GST');
  });

  it('returns text that can be parsed', async () => {
    const text = await simulateOCR('file:///test.jpg');
    const result = parseReceiptText(text);
    expect(result.amount).toBeGreaterThan(0);
    expect(result.vendor).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(50);
  });
});
