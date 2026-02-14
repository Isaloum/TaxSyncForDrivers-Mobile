/**
 * PDF Export Service — Generate & share professional tax reports
 *
 * Generates HTML-based PDF documents for:
 *  - T2125 Tax Summary (annual report for accountant/CRA)
 *  - Receipt list export
 *  - Mileage log export
 *
 * Uses expo-print for PDF generation and expo-sharing for sharing.
 * Works fully offline — no cloud dependencies.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// ─── HTML Template Helpers ──────────────────────────────────

const curr = (n) => `$${(n || 0).toFixed(2)}`;

/**
 * Common CSS styles for all PDF reports
 */
function getBaseStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.5;
      padding: 24px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1B5E20;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 20px;
      color: #1B5E20;
      margin-bottom: 4px;
    }
    .header .subtitle {
      font-size: 12px;
      color: #666;
    }
    .header .meta {
      font-size: 10px;
      color: #999;
      margin-top: 8px;
    }
    .section {
      margin-bottom: 18px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1B5E20;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    th {
      background: #f5f5f5;
      text-align: left;
      padding: 6px 8px;
      font-weight: 600;
      font-size: 10px;
      color: #555;
      border-bottom: 1px solid #ddd;
    }
    th.right, td.right {
      text-align: right;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 10px;
    }
    .total-row td {
      font-weight: 700;
      border-top: 2px solid #1B5E20;
      border-bottom: none;
      padding-top: 8px;
      font-size: 11px;
    }
    .grand-total {
      background: #1B5E20;
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 16px 0;
    }
    .grand-total .label {
      font-size: 14px;
      font-weight: 700;
    }
    .grand-total .value {
      font-size: 18px;
      font-weight: 700;
    }
    .footer {
      text-align: center;
      font-size: 9px;
      color: #999;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e0e0e0;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 600;
    }
    .badge-business { background: #e8f5e9; color: #2e7d32; }
    .badge-personal { background: #fff3e0; color: #e65100; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }
    .info-box {
      background: #f9f9f9;
      border: 1px solid #e8e8e8;
      border-radius: 6px;
      padding: 10px;
    }
    .info-box .label {
      font-size: 9px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-box .value {
      font-size: 16px;
      font-weight: 700;
      color: #1B5E20;
      margin-top: 2px;
    }
  `;
}

// ─── T2125 Tax Summary PDF ──────────────────────────────────

/**
 * Generate HTML for T2125 tax summary PDF
 * @param {Object} summary - Tax summary from generateTaxSummary()
 * @param {string} language - 'en' or 'fr'
 * @returns {string} - Complete HTML document
 */
export function generateTaxSummaryHTML(summary, language = 'en') {
  const isFr = language === 'fr';

  // Header
  const title = isFr ? 'RAPPORT FISCAL' : 'TAX SUMMARY REPORT';
  const subtitle = isFr
    ? 'ARC T2125 — État des résultats des activités d\'une entreprise'
    : 'CRA T2125 — Statement of Business Activities';
  const generatedLabel = isFr ? 'Généré le' : 'Generated';
  const genDate = new Date(summary.generatedAt).toLocaleDateString(
    isFr ? 'fr-CA' : 'en-CA',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  // Category rows
  const categoryRows = Object.keys(summary.expenses.categories)
    .filter(key => summary.expenses.categories[key].count > 0)
    .map(key => {
      const cat = summary.expenses.categories[key];
      const label = isFr ? cat.labelFr : cat.label;
      return `<tr>
        <td>${label}</td>
        <td class="right">${cat.count}</td>
        <td class="right">${curr(cat.total)}</td>
      </tr>`;
    })
    .join('');

  // Tax rows
  let taxRows = '';
  if (summary.tax.hstPaid > 0) {
    taxRows = `<tr><td>HST</td><td class="right">${curr(summary.tax.hstPaid)}</td></tr>`;
  } else {
    taxRows = `<tr><td>${isFr ? 'TPS (5%)' : 'GST (5%)'}</td><td class="right">${curr(summary.tax.gstPaid)}</td></tr>`;
    if (summary.tax.qstPaid > 0) {
      taxRows += `<tr><td>${isFr ? 'TVQ (9,975%)' : 'QST (9.975%)'}</td><td class="right">${curr(summary.tax.qstPaid)}</td></tr>`;
    }
  }

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} ${summary.year}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="header">
    <h1>${title} ${summary.year}</h1>
    <div class="subtitle">${subtitle}</div>
    <div class="meta">Province: ${summary.province} | ${generatedLabel}: ${genDate}</div>
  </div>

  <!-- Quick Summary -->
  <div class="info-grid">
    <div class="info-box">
      <div class="label">${isFr ? 'Total des dépenses' : 'Total Expenses'}</div>
      <div class="value">${curr(summary.expenses.totalExpenses)}</div>
    </div>
    <div class="info-box">
      <div class="label">${isFr ? 'Déduction kilométrique' : 'Mileage Deduction'}</div>
      <div class="value">${curr(summary.mileage.deduction)}</div>
    </div>
    <div class="info-box">
      <div class="label">${isFr ? 'Taxes payées' : 'Taxes Paid'}</div>
      <div class="value">${curr(summary.tax.totalTaxPaid)}</div>
    </div>
    <div class="info-box">
      <div class="label">${isFr ? 'Total des déductions' : 'Total Deductions'}</div>
      <div class="value">${curr(summary.totals.totalDeductions)}</div>
    </div>
  </div>

  <!-- Expenses by Category -->
  <div class="section">
    <div class="section-title">${isFr ? 'DÉPENSES PAR CATÉGORIE (T2125)' : 'EXPENSES BY CATEGORY (T2125)'}</div>
    <table>
      <thead>
        <tr>
          <th>${isFr ? 'Catégorie' : 'Category'}</th>
          <th class="right">${isFr ? 'Reçus' : 'Receipts'}</th>
          <th class="right">${isFr ? 'Montant' : 'Amount'}</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
        <tr class="total-row">
          <td>${isFr ? 'TOTAL DES DÉPENSES' : 'TOTAL EXPENSES'}</td>
          <td class="right">${summary.expenses.receiptCount}</td>
          <td class="right">${curr(summary.expenses.totalExpenses)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Mileage Summary -->
  <div class="section">
    <div class="section-title">${isFr ? 'KILOMÉTRAGE' : 'MILEAGE'}</div>
    <table>
      <tbody>
        <tr>
          <td>${isFr ? 'Km affaires' : 'Business km'}</td>
          <td class="right">${summary.mileage.totalBusinessKm} km (${summary.mileage.businessTripCount} ${isFr ? 'trajets' : 'trips'})</td>
        </tr>
        <tr>
          <td>${isFr ? 'Km personnel' : 'Personal km'}</td>
          <td class="right">${summary.mileage.totalPersonalKm} km (${summary.mileage.personalTripCount} ${isFr ? 'trajets' : 'trips'})</td>
        </tr>
        <tr>
          <td>${isFr ? 'Km total' : 'Total km'}</td>
          <td class="right">${summary.mileage.totalKm} km</td>
        </tr>
        <tr>
          <td>${isFr ? '% affaires' : 'Business %'}</td>
          <td class="right">${summary.mileage.businessPercent}%</td>
        </tr>
        <tr class="total-row">
          <td>${isFr ? 'Déduction (méthode simplifiée ARC)' : 'Deduction (CRA simplified method)'}</td>
          <td class="right">${curr(summary.mileage.deduction)}</td>
        </tr>
      </tbody>
    </table>
    <div style="font-size:9px;color:#888;font-style:italic;margin-top:4px;">
      ${isFr
        ? 'Méthode simplifiée ARC\u00A0: 0,70\u00A0$/km (premiers 5\u00A0000) + 0,64\u00A0$/km ensuite'
        : 'CRA simplified method: $0.70/km (first 5,000) + $0.64/km after'}
    </div>
  </div>

  <!-- Taxes Paid -->
  <div class="section">
    <div class="section-title">${isFr ? 'TAXES PAYÉES' : 'TAXES PAID'}</div>
    <table>
      <tbody>
        ${taxRows}
        <tr class="total-row">
          <td>${isFr ? 'Total des taxes payées' : 'Total Tax Paid'}</td>
          <td class="right">${curr(summary.tax.totalTaxPaid)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Grand Total -->
  <div class="grand-total">
    <span class="label">${isFr ? 'TOTAL DES DÉDUCTIONS' : 'TOTAL DEDUCTIONS'}</span>
    <span class="value">${curr(summary.totals.totalDeductions)}</span>
  </div>

  <div class="footer">
    <p>${isFr
      ? 'Ce rapport est fourni à titre informatif seulement. Consultez un professionnel de l\'impôt pour la déclaration.'
      : 'This report is for informational purposes only. Consult a tax professional for filing.'}</p>
    <p style="margin-top:6px;">TaxSync for Drivers — ${isFr ? 'Rapport T2125' : 'T2125 Report'} | ${genDate}</p>
  </div>
</body>
</html>`;
}

// ─── Receipt List PDF ───────────────────────────────────────

/**
 * Generate HTML for receipt list PDF
 * @param {Array} receipts - Receipt objects
 * @param {string} language - 'en' or 'fr'
 * @param {number} year - Filter year (optional)
 * @returns {string} - Complete HTML document
 */
export function generateReceiptListHTML(receipts, language = 'en', year = null) {
  const isFr = language === 'fr';
  const filtered = year
    ? receipts.filter(r => {
        const d = r.expense?.date;
        return d && String(d).startsWith(String(year));
      })
    : receipts;

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) =>
    (b.expense?.date || '').localeCompare(a.expense?.date || '')
  );

  const total = sorted.reduce((sum, r) => sum + (r.expense?.amount || 0), 0);

  const rows = sorted.map(r => `
    <tr>
      <td>${r.expense?.date || '-'}</td>
      <td>${r.expense?.vendor || '-'}</td>
      <td>${isFr
        ? (r.expense?.category || '-')
        : (r.expense?.category || '-')}</td>
      <td>${r.expense?.description || ''}</td>
      <td class="right">${curr(r.expense?.amount || 0)}</td>
    </tr>
  `).join('');

  const title = isFr ? 'LISTE DES REÇUS' : 'RECEIPT LIST';
  const yearLabel = year ? ` — ${year}` : '';

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${title}${yearLabel}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="header">
    <h1>${title}${yearLabel}</h1>
    <div class="subtitle">TaxSync for Drivers</div>
    <div class="meta">${sorted.length} ${isFr ? 'reçus' : 'receipts'} | ${isFr ? 'Généré le' : 'Generated'}: ${new Date().toLocaleDateString(isFr ? 'fr-CA' : 'en-CA')}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isFr ? 'Date' : 'Date'}</th>
        <th>${isFr ? 'Fournisseur' : 'Vendor'}</th>
        <th>${isFr ? 'Catégorie' : 'Category'}</th>
        <th>${isFr ? 'Description' : 'Description'}</th>
        <th class="right">${isFr ? 'Montant' : 'Amount'}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="4">${isFr ? 'TOTAL' : 'TOTAL'} (${sorted.length} ${isFr ? 'reçus' : 'receipts'})</td>
        <td class="right">${curr(total)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>TaxSync for Drivers — ${isFr ? 'Export des reçus' : 'Receipt Export'}</p>
  </div>
</body>
</html>`;
}

// ─── Mileage Log PDF ────────────────────────────────────────

/**
 * Generate HTML for mileage log PDF
 * @param {Array} trips - Trip objects
 * @param {string} language - 'en' or 'fr'
 * @param {number} year - Filter year (optional)
 * @returns {string} - Complete HTML document
 */
export function generateMileageLogHTML(trips, language = 'en', year = null) {
  const isFr = language === 'fr';
  const filtered = year
    ? trips.filter(t => t.date && String(t.date).startsWith(String(year)))
    : trips;

  const sorted = [...filtered].sort((a, b) =>
    (b.date || '').localeCompare(a.date || '')
  );

  const totalKm = sorted.reduce((sum, t) => sum + (t.distance || 0), 0);
  const businessKm = sorted
    .filter(t => t.type === 'business')
    .reduce((sum, t) => sum + (t.distance || 0), 0);

  const rows = sorted.map(t => `
    <tr>
      <td>${t.date || '-'}</td>
      <td>${t.destination || '-'}</td>
      <td>${t.purpose || '-'}</td>
      <td><span class="badge ${t.type === 'business' ? 'badge-business' : 'badge-personal'}">${
        t.type === 'business'
          ? (isFr ? 'Affaires' : 'Business')
          : (isFr ? 'Personnel' : 'Personal')
      }</span></td>
      <td class="right">${(t.distance || 0).toFixed(1)} km</td>
    </tr>
  `).join('');

  const title = isFr ? 'JOURNAL DE KILOMÉTRAGE' : 'MILEAGE LOG';
  const yearLabel = year ? ` — ${year}` : '';

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <title>${title}${yearLabel}</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="header">
    <h1>${title}${yearLabel}</h1>
    <div class="subtitle">TaxSync for Drivers</div>
    <div class="meta">${sorted.length} ${isFr ? 'trajets' : 'trips'} | ${isFr ? 'Généré le' : 'Generated'}: ${new Date().toLocaleDateString(isFr ? 'fr-CA' : 'en-CA')}</div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <div class="label">${isFr ? 'Km total' : 'Total km'}</div>
      <div class="value">${totalKm.toFixed(1)} km</div>
    </div>
    <div class="info-box">
      <div class="label">${isFr ? 'Km affaires' : 'Business km'}</div>
      <div class="value">${businessKm.toFixed(1)} km</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isFr ? 'Date' : 'Date'}</th>
        <th>${isFr ? 'Destination' : 'Destination'}</th>
        <th>${isFr ? 'Motif' : 'Purpose'}</th>
        <th>${isFr ? 'Type' : 'Type'}</th>
        <th class="right">${isFr ? 'Distance' : 'Distance'}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td colspan="4">${isFr ? 'TOTAL' : 'TOTAL'} (${sorted.length} ${isFr ? 'trajets' : 'trips'})</td>
        <td class="right">${totalKm.toFixed(1)} km</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>TaxSync for Drivers — ${isFr ? 'Export du kilométrage' : 'Mileage Export'}</p>
  </div>
</body>
</html>`;
}

// ─── PDF Generation & Sharing ───────────────────────────────

/**
 * Generate a PDF from HTML and share it
 * @param {string} html - Complete HTML document
 * @param {string} filename - Filename for the PDF (without extension)
 * @returns {Promise<{ uri: string, shared: boolean }>}
 */
export async function generateAndSharePDF(html, filename = 'TaxSync-Report') {
  // Generate PDF
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Rename to a meaningful filename
  const pdfFilename = `${filename}.pdf`;
  const newUri = `${FileSystem.documentDirectory}${pdfFilename}`;

  // Move to documents directory with proper name
  try {
    await FileSystem.moveAsync({ from: uri, to: newUri });
  } catch {
    // If move fails, use original URI
    return shareFile(uri, pdfFilename);
  }

  return shareFile(newUri, pdfFilename);
}

/**
 * Share a file using the system share sheet
 * @param {string} uri - File URI
 * @param {string} filename - Display filename
 * @returns {Promise<{ uri: string, shared: boolean }>}
 */
async function shareFile(uri, filename) {
  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: filename,
      UTI: 'com.adobe.pdf',
    });
    return { uri, shared: true };
  }

  // On web or unsupported platforms, return URI for manual handling
  return { uri, shared: false };
}

/**
 * Export T2125 tax summary as PDF
 * @param {Object} summary - Tax summary from generateTaxSummary()
 * @param {string} language - 'en' or 'fr'
 * @returns {Promise<{ uri: string, shared: boolean }>}
 */
export async function exportTaxSummaryPDF(summary, language = 'en') {
  const html = generateTaxSummaryHTML(summary, language);
  const filename = `TaxSync-T2125-${summary.year}-${summary.province}`;
  return generateAndSharePDF(html, filename);
}

/**
 * Export receipt list as PDF
 * @param {Array} receipts - Receipt objects
 * @param {string} language - 'en' or 'fr'
 * @param {number} year - Filter year (optional)
 * @returns {Promise<{ uri: string, shared: boolean }>}
 */
export async function exportReceiptsPDF(receipts, language = 'en', year = null) {
  const html = generateReceiptListHTML(receipts, language, year);
  const filename = `TaxSync-Receipts${year ? `-${year}` : ''}`;
  return generateAndSharePDF(html, filename);
}

/**
 * Export mileage log as PDF
 * @param {Array} trips - Trip objects
 * @param {string} language - 'en' or 'fr'
 * @param {number} year - Filter year (optional)
 * @returns {Promise<{ uri: string, shared: boolean }>}
 */
export async function exportMileagePDF(trips, language = 'en', year = null) {
  const html = generateMileageLogHTML(trips, language, year);
  const filename = `TaxSync-Mileage${year ? `-${year}` : ''}`;
  return generateAndSharePDF(html, filename);
}
