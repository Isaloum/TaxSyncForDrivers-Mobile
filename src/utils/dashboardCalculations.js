import { RECEIPT_CATEGORIES } from '../constants/categories';
import { GST_RATE, QST_RATE } from '../constants/categories';

function getCategoryLabel(key) {
  const cat = RECEIPT_CATEGORIES.find((c) => c.key === key);
  return cat ? cat.label : key || 'Other';
}

/** Parse YYYY-MM-DD as local date to avoid UTC timezone shifts. */
function parseLocalDate(dateStr) {
  if (!dateStr) return new Date(NaN);
  const parts = String(dateStr).split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]) || 1);
}

/**
 * Group receipts by category with totals.
 */
export function getExpensesByCategory(receipts) {
  const map = {};
  receipts.forEach((r) => {
    const key = r.expense?.category || 'other';
    if (!map[key]) {
      map[key] = { key, label: getCategoryLabel(key), total: 0, count: 0 };
    }
    map[key].total += r.expense?.amount || 0;
    map[key].count += 1;
  });

  return Object.values(map).sort((a, b) => b.total - a.total);
}

/**
 * Group receipts by month for the given year. Returns array of 12 numbers.
 */
export function getMonthlyExpenses(receipts, year) {
  const monthly = new Array(12).fill(0);
  receipts.forEach((r) => {
    const d = parseLocalDate(r.expense?.date);
    if (d.getFullYear() === year) {
      monthly[d.getMonth()] += r.expense?.amount || 0;
    }
  });
  return monthly.map((v) => Math.round(v * 100) / 100);
}

/**
 * Group trips by month for the given year. Returns array of 12 numbers (km).
 */
export function getMonthlyMileage(trips, year) {
  const monthly = new Array(12).fill(0);
  trips.forEach((t) => {
    const d = parseLocalDate(t.date);
    if (d.getFullYear() === year) {
      monthly[d.getMonth()] += t.distance || 0;
    }
  });
  return monthly;
}

/**
 * Estimate GST/QST collected and ITC for a given province.
 */
export function getGSTQSTSummary(receipts, province) {
  const totalExpenses = receipts.reduce((sum, r) => sum + (r.expense?.amount || 0), 0);

  const gstPaid = totalExpenses * GST_RATE;
  const qstPaid = province === 'QC' ? totalExpenses * QST_RATE : 0;

  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    gstPaid: Math.round(gstPaid * 100) / 100,
    qstPaid: Math.round(qstPaid * 100) / 100,
    totalTaxPaid: Math.round((gstPaid + qstPaid) * 100) / 100,
  };
}

/**
 * Get year-over-year comparison data.
 */
export function getYearComparison(receipts) {
  const years = {};
  receipts.forEach((r) => {
    const year = parseLocalDate(r.expense?.date).getFullYear();
    if (!years[year]) years[year] = { year, total: 0, count: 0 };
    years[year].total += r.expense?.amount || 0;
    years[year].count += 1;
  });
  return Object.values(years).sort((a, b) => b.year - a.year);
}
