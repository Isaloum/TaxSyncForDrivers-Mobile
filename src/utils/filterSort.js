/**
 * Filtering and sorting utilities for receipts and trips.
 */

// ---- Receipts ----

/**
 * Filter receipts by search query and category.
 */
export function filterReceipts(receipts, { search = '', category = 'all' } = {}) {
  let result = receipts;

  if (category !== 'all') {
    result = result.filter((r) => r.expense?.category === category);
  }

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter((r) => {
      const vendor = (r.expense?.vendor || '').toLowerCase();
      const desc = (r.expense?.description || '').toLowerCase();
      const amount = String(r.expense?.amount || '');
      const date = (r.date || '').toLowerCase();
      return vendor.includes(q) || desc.includes(q) || amount.includes(q) || date.includes(q);
    });
  }

  return result;
}

/**
 * Sort receipts by the given key.
 * Keys: 'date_desc', 'date_asc', 'amount_desc', 'amount_asc'
 */
export function sortReceipts(receipts, sortKey = 'date_desc') {
  const sorted = [...receipts];
  switch (sortKey) {
    case 'date_asc':
      return sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    case 'date_desc':
      return sorted.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    case 'amount_asc':
      return sorted.sort((a, b) => (a.expense?.amount || 0) - (b.expense?.amount || 0));
    case 'amount_desc':
      return sorted.sort((a, b) => (b.expense?.amount || 0) - (a.expense?.amount || 0));
    default:
      return sorted;
  }
}

// ---- Trips ----

/**
 * Filter trips by search query and type.
 * type: 'all', 'business', 'personal'
 */
export function filterTrips(trips, { search = '', tripType = 'all' } = {}) {
  let result = trips;

  if (tripType === 'business') {
    result = result.filter((t) => t.isBusinessTrip === true);
  } else if (tripType === 'personal') {
    result = result.filter((t) => t.isBusinessTrip === false);
  }

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter((t) => {
      const dest = (t.destination || '').toLowerCase();
      const purpose = (t.purpose || '').toLowerCase();
      const client = (t.clientName || '').toLowerCase();
      const date = (t.date || '').toLowerCase();
      return dest.includes(q) || purpose.includes(q) || client.includes(q) || date.includes(q);
    });
  }

  return result;
}

/**
 * Sort trips by the given key.
 * Keys: 'date_desc', 'date_asc', 'distance_desc', 'distance_asc'
 */
export function sortTrips(trips, sortKey = 'date_desc') {
  const sorted = [...trips];
  switch (sortKey) {
    case 'date_asc':
      return sorted.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    case 'date_desc':
      return sorted.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    case 'distance_asc':
      return sorted.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    case 'distance_desc':
      return sorted.sort((a, b) => (b.distance || 0) - (a.distance || 0));
    default:
      return sorted;
  }
}
