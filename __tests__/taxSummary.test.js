import {
  generateTaxSummary,
  calculateMileageDeduction,
  getHSTRate,
  formatTaxReport,
} from '../src/utils/taxSummary';

// ─── Sample Data ─────────────────────────────────────────────
const makeReceipt = (amount, category, date) => ({
  id: `receipt-${Math.random()}`,
  expense: { amount, category, date, vendor: 'Test', description: '' },
  metadata: { uploadedAt: date },
});

const makeTrip = (distance, type, date) => ({
  id: `trip-${Math.random()}`,
  date,
  distance,
  type, // 'business' or 'personal'
  destination: 'Test',
  purpose: 'Test',
});

const sampleReceipts = [
  makeReceipt(80.64, 'fuel', '2026-01-15'),
  makeReceipt(45.00, 'fuel', '2026-02-10'),
  makeReceipt(120.00, 'maintenance', '2026-03-01'),
  makeReceipt(65.00, 'telephone', '2026-01-20'),
  makeReceipt(30.00, 'supplies', '2026-04-15'),
  makeReceipt(200.00, 'insurance', '2025-06-01'), // Different year
];

const sampleTrips = [
  makeTrip(150, 'business', '2026-01-10'),
  makeTrip(80, 'business', '2026-02-15'),
  makeTrip(50, 'personal', '2026-01-20'),
  makeTrip(200, 'business', '2026-03-10'),
  makeTrip(100, 'personal', '2025-06-01'), // Different year
];

// ─── calculateMileageDeduction ───────────────────────────────
describe('calculateMileageDeduction', () => {
  it('returns 0 for 0 km', () => {
    expect(calculateMileageDeduction(0)).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(calculateMileageDeduction(null)).toBe(0);
  });

  it('calculates under 5000 km at $0.70/km', () => {
    expect(calculateMileageDeduction(1000)).toBe(700);
    expect(calculateMileageDeduction(3000)).toBe(2100);
  });

  it('calculates exactly 5000 km', () => {
    expect(calculateMileageDeduction(5000)).toBe(3500);
  });

  it('calculates over 5000 km with split rates', () => {
    // 5000 * 0.70 + 1000 * 0.64 = 3500 + 640 = 4140
    expect(calculateMileageDeduction(6000)).toBe(4140);
    // 5000 * 0.70 + 5000 * 0.64 = 3500 + 3200 = 6700
    expect(calculateMileageDeduction(10000)).toBe(6700);
  });
});

// ─── getHSTRate ──────────────────────────────────────────────
describe('getHSTRate', () => {
  it('returns 0.13 for Ontario', () => {
    expect(getHSTRate('ON')).toBe(0.13);
  });

  it('returns 0.15 for New Brunswick', () => {
    expect(getHSTRate('NB')).toBe(0.15);
  });

  it('returns 0 for Quebec (uses GST+QST)', () => {
    expect(getHSTRate('QC')).toBe(0);
  });

  it('returns 0 for Alberta (no HST)', () => {
    expect(getHSTRate('AB')).toBe(0);
  });
});

// ─── generateTaxSummary ─────────────────────────────────────
describe('generateTaxSummary', () => {
  it('generates summary for 2026 with correct expense total', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    // Only 2026 receipts: 80.64 + 45 + 120 + 65 + 30 = 340.64
    expect(summary.expenses.totalExpenses).toBe(340.64);
    expect(summary.expenses.receiptCount).toBe(5);
  });

  it('filters by year correctly', () => {
    const summary2025 = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2025);
    expect(summary2025.expenses.totalExpenses).toBe(200); // Only the insurance receipt
    expect(summary2025.expenses.receiptCount).toBe(1);
  });

  it('calculates category breakdown', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    expect(summary.expenses.categories.fuel.total).toBe(125.64);
    expect(summary.expenses.categories.fuel.count).toBe(2);
    expect(summary.expenses.categories.maintenance.total).toBe(120);
    expect(summary.expenses.categories.telephone.total).toBe(65);
  });

  it('calculates mileage breakdown', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    // 2026 business: 150 + 80 + 200 = 430
    expect(summary.mileage.totalBusinessKm).toBe(430);
    // 2026 personal: 50
    expect(summary.mileage.totalPersonalKm).toBe(50);
    expect(summary.mileage.totalKm).toBe(480);
    expect(summary.mileage.businessTripCount).toBe(3);
    expect(summary.mileage.personalTripCount).toBe(1);
  });

  it('calculates business percentage', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    // 430 / 480 = 89.58...%
    expect(summary.mileage.businessPercent).toBeCloseTo(89.6, 0);
  });

  it('calculates mileage deduction', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    // 430 km * $0.70/km = $301
    expect(summary.mileage.deduction).toBe(301);
  });

  it('calculates GST for Quebec', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    expect(summary.tax.gstPaid).toBe(17.03); // 340.64 * 0.05
    expect(summary.tax.qstPaid).toBeGreaterThan(0);
    expect(summary.tax.hstPaid).toBe(0);
  });

  it('calculates HST for Ontario', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'ON', 2026);
    expect(summary.tax.hstPaid).toBe(44.28); // 340.64 * 0.13
    expect(summary.tax.qstPaid).toBe(0);
  });

  it('calculates total deductions', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    // expenses (340.64) + mileage deduction (301) = 641.64
    expect(summary.totals.totalDeductions).toBe(641.64);
  });

  it('includes metadata', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    expect(summary.year).toBe(2026);
    expect(summary.province).toBe('QC');
    expect(summary.generatedAt).toBeTruthy();
  });

  it('handles empty data', () => {
    const summary = generateTaxSummary([], [], 'QC', 2026);
    expect(summary.expenses.totalExpenses).toBe(0);
    expect(summary.mileage.totalKm).toBe(0);
    expect(summary.mileage.businessPercent).toBe(0);
    expect(summary.totals.totalDeductions).toBe(0);
  });
});

// ─── formatTaxReport ─────────────────────────────────────────
describe('formatTaxReport', () => {
  it('generates English report', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    const report = formatTaxReport(summary, 'en');
    expect(report).toContain('TAX SUMMARY REPORT 2026');
    expect(report).toContain('EXPENSES BY CATEGORY');
    expect(report).toContain('MILEAGE');
    expect(report).toContain('TAXES PAID');
    expect(report).toContain('SUMMARY');
    expect(report).toContain('T2125 Report');
  });

  it('generates French report', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    const report = formatTaxReport(summary, 'fr');
    expect(report).toContain('RAPPORT FISCAL 2026');
    expect(report).toContain('DÉPENSES PAR CATÉGORIE');
    expect(report).toContain('KILOMÉTRAGE');
    expect(report).toContain('TAXES PAYÉES');
    expect(report).toContain('RÉSUMÉ');
    expect(report).toContain('Rapport T2125');
  });

  it('includes dollar amounts', () => {
    const summary = generateTaxSummary(sampleReceipts, sampleTrips, 'QC', 2026);
    const report = formatTaxReport(summary, 'en');
    expect(report).toContain('$340.64');
    expect(report).toContain('430 km');
  });
});
