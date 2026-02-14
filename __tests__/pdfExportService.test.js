import {
  generateTaxSummaryHTML,
  generateReceiptListHTML,
  generateMileageLogHTML,
} from '../src/services/pdfExportService';

// ─── Sample Data ─────────────────────────────────────────────

const makeSummary = (overrides = {}) => ({
  year: 2026,
  province: 'QC',
  expenses: {
    categories: {
      fuel: { label: 'Fuel', labelFr: 'Carburant', total: 125.64, count: 2 },
      maintenance: { label: 'Maintenance', labelFr: 'Entretien', total: 120, count: 1 },
      telephone: { label: 'Telephone', labelFr: 'Téléphone', total: 65, count: 1 },
      supplies: { label: 'Supplies', labelFr: 'Fournitures', total: 30, count: 1 },
      insurance: { label: 'Insurance', labelFr: 'Assurance', total: 0, count: 0 },
    },
    totalExpenses: 340.64,
    receiptCount: 5,
  },
  mileage: {
    totalKm: 480,
    totalBusinessKm: 430,
    totalPersonalKm: 50,
    businessPercent: 89.6,
    tripCount: 4,
    businessTripCount: 3,
    personalTripCount: 1,
    deduction: 301,
  },
  tax: {
    gstPaid: 17.03,
    qstPaid: 33.98,
    hstPaid: 0,
    totalTaxPaid: 51.01,
  },
  totals: {
    totalDeductions: 641.64,
    totalTaxCredits: 51.01,
  },
  generatedAt: '2026-02-13T12:00:00.000Z',
  ...overrides,
});

const sampleReceipts = [
  {
    id: 'r1',
    expense: { amount: 80.64, category: 'fuel', date: '2026-01-15', vendor: 'Shell', description: 'Gas' },
    metadata: { uploadedAt: '2026-01-15' },
  },
  {
    id: 'r2',
    expense: { amount: 45.00, category: 'fuel', date: '2026-02-10', vendor: 'Petro-Canada', description: '' },
    metadata: { uploadedAt: '2026-02-10' },
  },
  {
    id: 'r3',
    expense: { amount: 120.00, category: 'maintenance', date: '2026-03-01', vendor: 'Canadian Tire', description: 'Oil change' },
    metadata: { uploadedAt: '2026-03-01' },
  },
  {
    id: 'r4',
    expense: { amount: 200.00, category: 'insurance', date: '2025-06-01', vendor: 'Intact', description: 'Premium' },
    metadata: { uploadedAt: '2025-06-01' },
  },
];

const sampleTrips = [
  { id: 't1', date: '2026-01-10', distance: 150, type: 'business', destination: 'Client A', purpose: 'Delivery' },
  { id: 't2', date: '2026-02-15', distance: 80, type: 'business', destination: 'Client B', purpose: 'Pickup' },
  { id: 't3', date: '2026-01-20', distance: 50, type: 'personal', destination: 'Home', purpose: 'Commute' },
  { id: 't4', date: '2025-06-01', distance: 100, type: 'personal', destination: 'Vacation', purpose: 'Personal' },
];

// ─── generateTaxSummaryHTML ──────────────────────────────────

describe('generateTaxSummaryHTML', () => {
  it('generates valid HTML document', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('includes report title with year', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('TAX SUMMARY REPORT 2026');
  });

  it('includes T2125 subtitle in English', () => {
    const html = generateTaxSummaryHTML(makeSummary(), 'en');
    expect(html).toContain('CRA T2125');
    expect(html).toContain('Statement of Business Activities');
  });

  it('includes T2125 subtitle in French', () => {
    const html = generateTaxSummaryHTML(makeSummary(), 'fr');
    expect(html).toContain('RAPPORT FISCAL 2026');
    expect(html).toContain('ARC T2125');
  });

  it('includes expense categories', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('Fuel');
    expect(html).toContain('$125.64');
    expect(html).toContain('Maintenance');
    expect(html).toContain('$120.00');
  });

  it('excludes zero-count categories', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    // Insurance has count 0, should not appear as a data row
    // (it might appear in CSS or labels, but not as a category row)
    expect(html).not.toContain('>Insurance<');
  });

  it('includes total expenses', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('$340.64');
  });

  it('includes mileage data', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('430 km');
    expect(html).toContain('50 km');
    expect(html).toContain('89.6%');
    expect(html).toContain('$301.00');
  });

  it('includes GST/QST for Quebec', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('GST (5%)');
    expect(html).toContain('$17.03');
    expect(html).toContain('QST (9.975%)');
    expect(html).toContain('$33.98');
  });

  it('includes HST for Ontario', () => {
    const ontarioSummary = makeSummary({
      province: 'ON',
      tax: { gstPaid: 0, qstPaid: 0, hstPaid: 44.28, totalTaxPaid: 44.28 },
    });
    const html = generateTaxSummaryHTML(ontarioSummary);
    expect(html).toContain('HST');
    expect(html).toContain('$44.28');
  });

  it('includes grand total deductions', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('$641.64');
  });

  it('includes province', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('Province: QC');
  });

  it('uses French labels when language is fr', () => {
    const html = generateTaxSummaryHTML(makeSummary(), 'fr');
    expect(html).toContain('Carburant');
    expect(html).toContain('Entretien');
    expect(html).toContain('DÉPENSES PAR CATÉGORIE');
    expect(html).toContain('KILOMÉTRAGE');
    expect(html).toContain('TAXES PAYÉES');
  });

  it('includes CRA simplified method note', () => {
    const html = generateTaxSummaryHTML(makeSummary(), 'en');
    expect(html).toContain('CRA simplified method');
    expect(html).toContain('$0.70/km');
  });

  it('includes disclaimer footer', () => {
    const html = generateTaxSummaryHTML(makeSummary(), 'en');
    expect(html).toContain('informational purposes only');
    expect(html).toContain('T2125 Report');
  });

  it('includes quick summary info boxes', () => {
    const html = generateTaxSummaryHTML(makeSummary());
    expect(html).toContain('Total Expenses');
    expect(html).toContain('Mileage Deduction');
    expect(html).toContain('Taxes Paid');
    expect(html).toContain('Total Deductions');
  });
});

// ─── generateReceiptListHTML ─────────────────────────────────

describe('generateReceiptListHTML', () => {
  it('generates valid HTML', () => {
    const html = generateReceiptListHTML(sampleReceipts);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('RECEIPT LIST');
  });

  it('includes receipt data', () => {
    const html = generateReceiptListHTML(sampleReceipts);
    expect(html).toContain('Shell');
    expect(html).toContain('$80.64');
    expect(html).toContain('Petro-Canada');
    expect(html).toContain('$45.00');
  });

  it('filters by year when specified', () => {
    const html = generateReceiptListHTML(sampleReceipts, 'en', 2026);
    expect(html).toContain('Shell');
    expect(html).toContain('Petro-Canada');
    expect(html).not.toContain('Intact'); // 2025 receipt
  });

  it('includes all receipts when no year filter', () => {
    const html = generateReceiptListHTML(sampleReceipts);
    expect(html).toContain('Shell');
    expect(html).toContain('Intact');
    expect(html).toContain('4 receipts');
  });

  it('calculates total correctly', () => {
    const html = generateReceiptListHTML(sampleReceipts, 'en', 2026);
    // 80.64 + 45.00 + 120.00 = 245.64
    expect(html).toContain('$245.64');
  });

  it('uses French labels', () => {
    const html = generateReceiptListHTML(sampleReceipts, 'fr');
    expect(html).toContain('LISTE DES REÇUS');
    expect(html).toContain('Fournisseur');
    expect(html).toContain('Montant');
    expect(html).toContain('reçus');
  });

  it('includes year in title when filtered', () => {
    const html = generateReceiptListHTML(sampleReceipts, 'en', 2026);
    expect(html).toContain('RECEIPT LIST — 2026');
  });

  it('handles empty receipt list', () => {
    const html = generateReceiptListHTML([]);
    expect(html).toContain('0 receipts');
    expect(html).toContain('$0.00');
  });
});

// ─── generateMileageLogHTML ──────────────────────────────────

describe('generateMileageLogHTML', () => {
  it('generates valid HTML', () => {
    const html = generateMileageLogHTML(sampleTrips);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('MILEAGE LOG');
  });

  it('includes trip data', () => {
    const html = generateMileageLogHTML(sampleTrips);
    expect(html).toContain('Client A');
    expect(html).toContain('Delivery');
    expect(html).toContain('150.0 km');
  });

  it('includes business/personal badges', () => {
    const html = generateMileageLogHTML(sampleTrips);
    expect(html).toContain('Business');
    expect(html).toContain('Personal');
    expect(html).toContain('badge-business');
    expect(html).toContain('badge-personal');
  });

  it('filters by year when specified', () => {
    const html = generateMileageLogHTML(sampleTrips, 'en', 2026);
    expect(html).toContain('Client A');
    expect(html).toContain('Client B');
    expect(html).not.toContain('Vacation'); // 2025 trip
  });

  it('calculates total km correctly', () => {
    const html = generateMileageLogHTML(sampleTrips, 'en', 2026);
    // 150 + 80 + 50 = 280.0
    expect(html).toContain('280.0 km');
  });

  it('shows business km summary', () => {
    const html = generateMileageLogHTML(sampleTrips, 'en', 2026);
    // Business: 150 + 80 = 230.0
    expect(html).toContain('230.0 km');
  });

  it('uses French labels', () => {
    const html = generateMileageLogHTML(sampleTrips, 'fr');
    expect(html).toContain('JOURNAL DE KILOMÉTRAGE');
    expect(html).toContain('Destination');
    expect(html).toContain('Affaires');
    expect(html).toContain('Personnel');
    expect(html).toContain('trajets');
  });

  it('includes year in title when filtered', () => {
    const html = generateMileageLogHTML(sampleTrips, 'en', 2026);
    expect(html).toContain('MILEAGE LOG — 2026');
  });

  it('handles empty trip list', () => {
    const html = generateMileageLogHTML([]);
    expect(html).toContain('0 trips');
    expect(html).toContain('0.0 km');
  });
});
