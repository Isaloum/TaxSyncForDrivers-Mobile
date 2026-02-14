/**
 * Tax Summary Calculator — CRA T2125 Report Generator
 *
 * Aggregates receipts and mileage trips into a comprehensive
 * tax summary aligned with CRA Form T2125 (Statement of
 * Business Activities) for self-employed rideshare/delivery drivers.
 */

import { RECEIPT_CATEGORIES, VEHICLE_RATES_2026, GST_RATE, QST_RATE } from '../constants/categories';

/** Parse YYYY-MM-DD as local date */
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const parts = String(dateStr).split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) || 1);
}

/**
 * Generate a full T2125-aligned tax summary for a given year
 * @param {Array} receipts - All receipts from storage
 * @param {Array} trips - All trips from storage
 * @param {string} province - Province code (e.g., 'QC', 'ON')
 * @param {number} year - Tax year
 * @returns {Object} - Complete tax summary
 */
export function generateTaxSummary(receipts, trips, province, year) {
  // Filter by year
  const yearReceipts = receipts.filter(r => {
    const d = parseLocalDate(r.expense?.date);
    return d.getFullYear() === year;
  });

  const yearTrips = trips.filter(t => {
    const d = parseLocalDate(t.date);
    return d.getFullYear() === year;
  });

  // ─── Expense Summary by T2125 Category ───
  const categoryTotals = {};
  RECEIPT_CATEGORIES.forEach(cat => {
    categoryTotals[cat.key] = { label: cat.label, labelFr: cat.labelFr, total: 0, count: 0 };
  });

  yearReceipts.forEach(r => {
    const cat = r.expense?.category || 'other';
    if (!categoryTotals[cat]) {
      categoryTotals[cat] = { label: cat, labelFr: cat, total: 0, count: 0 };
    }
    categoryTotals[cat].total += r.expense?.amount || 0;
    categoryTotals[cat].count += 1;
  });

  // Round totals
  Object.keys(categoryTotals).forEach(k => {
    categoryTotals[k].total = Math.round(categoryTotals[k].total * 100) / 100;
  });

  const totalExpenses = Math.round(
    yearReceipts.reduce((sum, r) => sum + (r.expense?.amount || 0), 0) * 100
  ) / 100;

  // ─── Mileage Summary ───
  const businessTrips = yearTrips.filter(t => t.type === 'business');
  const personalTrips = yearTrips.filter(t => t.type === 'personal');

  const totalBusinessKm = Math.round(
    businessTrips.reduce((sum, t) => sum + (t.distance || 0), 0) * 10
  ) / 10;

  const totalPersonalKm = Math.round(
    personalTrips.reduce((sum, t) => sum + (t.distance || 0), 0) * 10
  ) / 10;

  const totalKm = Math.round((totalBusinessKm + totalPersonalKm) * 10) / 10;
  const businessPercent = totalKm > 0
    ? Math.round((totalBusinessKm / totalKm) * 1000) / 10
    : 0;

  // CRA Simplified Mileage Deduction
  const mileageDeduction = calculateMileageDeduction(totalBusinessKm);

  // ─── Tax Summary (GST/QST/HST) ───
  const gstPaid = Math.round(totalExpenses * GST_RATE * 100) / 100;
  const qstPaid = province === 'QC'
    ? Math.round(totalExpenses * QST_RATE * 100) / 100
    : 0;
  const hstRate = getHSTRate(province);
  const hstPaid = hstRate > 0
    ? Math.round(totalExpenses * hstRate * 100) / 100
    : 0;
  const totalTaxPaid = Math.round((gstPaid + qstPaid + hstPaid) * 100) / 100;

  // ─── Net Business Income Estimate ───
  const totalDeductions = Math.round((totalExpenses + mileageDeduction) * 100) / 100;

  return {
    year,
    province,
    // Expense breakdown
    expenses: {
      categories: categoryTotals,
      totalExpenses,
      receiptCount: yearReceipts.length,
    },
    // Mileage breakdown
    mileage: {
      totalKm,
      totalBusinessKm,
      totalPersonalKm,
      businessPercent,
      tripCount: yearTrips.length,
      businessTripCount: businessTrips.length,
      personalTripCount: personalTrips.length,
      deduction: mileageDeduction,
    },
    // Tax breakdown
    tax: {
      gstPaid,
      qstPaid,
      hstPaid,
      totalTaxPaid,
    },
    // Totals
    totals: {
      totalDeductions,
      totalTaxCredits: totalTaxPaid,
    },
    // Metadata
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate CRA simplified mileage deduction
 * @param {number} businessKm - Total business kilometers
 * @returns {number} - Deduction amount in dollars
 */
export function calculateMileageDeduction(businessKm) {
  if (!businessKm || businessKm <= 0) return 0;

  const { first5000km, after5000km } = VEHICLE_RATES_2026;

  let deduction;
  if (businessKm <= 5000) {
    deduction = businessKm * first5000km;
  } else {
    deduction = (5000 * first5000km) + ((businessKm - 5000) * after5000km);
  }

  return Math.round(deduction * 100) / 100;
}

/**
 * Get HST rate for province (for provinces that use HST instead of GST+PST)
 * @param {string} province - Province code
 * @returns {number} - HST rate (0 if province doesn't use HST)
 */
export function getHSTRate(province) {
  const HST_RATES = {
    ON: 0.13,
    NB: 0.15,
    NS: 0.15,
    NL: 0.15,
    PE: 0.15,
  };
  return HST_RATES[province] || 0;
}

/**
 * Format tax summary as plain text report
 * @param {Object} summary - Generated tax summary
 * @param {string} language - 'en' or 'fr'
 * @returns {string} - Formatted text report
 */
export function formatTaxReport(summary, language = 'en') {
  const isFr = language === 'fr';
  const curr = (n) => `$${n.toFixed(2)}`;
  const sep = '─'.repeat(44);

  const lines = [
    isFr ? `RAPPORT FISCAL ${summary.year}` : `TAX SUMMARY REPORT ${summary.year}`,
    isFr ? `Province: ${summary.province}` : `Province: ${summary.province}`,
    isFr ? `Généré le: ${new Date(summary.generatedAt).toLocaleDateString('fr-CA')}` : `Generated: ${new Date(summary.generatedAt).toLocaleDateString('en-CA')}`,
    sep,
    '',
    isFr ? '═══ DÉPENSES PAR CATÉGORIE (T2125) ═══' : '═══ EXPENSES BY CATEGORY (T2125) ═══',
    '',
  ];

  // Category breakdown
  const cats = summary.expenses.categories;
  Object.keys(cats).forEach(key => {
    const cat = cats[key];
    if (cat.count > 0) {
      const label = isFr ? cat.labelFr : cat.label;
      lines.push(`  ${label}: ${curr(cat.total)} (${cat.count} ${isFr ? 'reçus' : 'receipts'})`);
    }
  });

  lines.push('');
  lines.push(`  ${isFr ? 'TOTAL DES DÉPENSES' : 'TOTAL EXPENSES'}: ${curr(summary.expenses.totalExpenses)}`);
  lines.push(`  ${isFr ? 'Nombre de reçus' : 'Receipt count'}: ${summary.expenses.receiptCount}`);
  lines.push('');
  lines.push(sep);
  lines.push('');
  lines.push(isFr ? '═══ KILOMÉTRAGE ═══' : '═══ MILEAGE ═══');
  lines.push('');
  lines.push(`  ${isFr ? 'Km affaires' : 'Business km'}: ${summary.mileage.totalBusinessKm} km`);
  lines.push(`  ${isFr ? 'Km personnel' : 'Personal km'}: ${summary.mileage.totalPersonalKm} km`);
  lines.push(`  ${isFr ? 'Km total' : 'Total km'}: ${summary.mileage.totalKm} km`);
  lines.push(`  ${isFr ? '% affaires' : 'Business %'}: ${summary.mileage.businessPercent}%`);
  lines.push(`  ${isFr ? 'Déduction (méthode simplifiée ARC)' : 'Deduction (CRA simplified)'}: ${curr(summary.mileage.deduction)}`);
  lines.push('');
  lines.push(sep);
  lines.push('');
  lines.push(isFr ? '═══ TAXES PAYÉES ═══' : '═══ TAXES PAID ═══');
  lines.push('');

  if (summary.tax.hstPaid > 0) {
    lines.push(`  HST: ${curr(summary.tax.hstPaid)}`);
  } else {
    lines.push(`  ${isFr ? 'TPS (5%)' : 'GST (5%)'}: ${curr(summary.tax.gstPaid)}`);
    if (summary.tax.qstPaid > 0) {
      lines.push(`  ${isFr ? 'TVQ (9,975%)' : 'QST (9.975%)'}: ${curr(summary.tax.qstPaid)}`);
    }
  }
  lines.push(`  ${isFr ? 'Total taxes payées' : 'Total tax paid'}: ${curr(summary.tax.totalTaxPaid)}`);
  lines.push('');
  lines.push(sep);
  lines.push('');
  lines.push(isFr ? '═══ RÉSUMÉ ═══' : '═══ SUMMARY ═══');
  lines.push('');
  lines.push(`  ${isFr ? 'Total des déductions' : 'Total deductions'}: ${curr(summary.totals.totalDeductions)}`);
  lines.push(`  ${isFr ? 'Crédits de taxe (CTI)' : 'Tax credits (ITC)'}: ${curr(summary.totals.totalTaxCredits)}`);
  lines.push('');
  lines.push(sep);
  lines.push(isFr ? 'TaxSync for Drivers — Rapport T2125' : 'TaxSync for Drivers — T2125 Report');

  return lines.join('\n');
}
