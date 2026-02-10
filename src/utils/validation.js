import { RECEIPT_CATEGORIES } from '../constants/categories';

export function validateReceipt(receipt) {
  const errors = [];

  if (receipt.amount === undefined || receipt.amount === null || receipt.amount === '') {
    errors.push('Amount is required');
  } else {
    const numAmount = Number(receipt.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errors.push('Amount must be a positive number');
    }
  }

  if (!receipt.date) {
    errors.push('Date is required');
  } else {
    const d = new Date(receipt.date);
    if (isNaN(d.getTime())) {
      errors.push('Invalid date');
    } else if (d > new Date()) {
      errors.push('Date cannot be in the future');
    }
  }

  const validKeys = RECEIPT_CATEGORIES.map((c) => c.key);
  if (receipt.category && !validKeys.includes(receipt.category)) {
    errors.push('Invalid category');
  }

  if (receipt.vendor !== undefined && receipt.vendor !== null && receipt.vendor !== '') {
    if (typeof receipt.vendor !== 'string' || receipt.vendor.trim().length === 0) {
      errors.push('Vendor must be a non-empty string');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateTrip(trip) {
  const errors = [];

  if (!trip.date) {
    errors.push('Date is required');
  }

  if (!trip.destination || trip.destination.trim() === '') {
    errors.push('Destination is required');
  }

  if (!trip.purpose || trip.purpose.trim() === '') {
    errors.push('Purpose is required');
  }

  const start = Number(trip.startOdometer);
  const end = Number(trip.endOdometer);

  if (isNaN(start) || start < 0) {
    errors.push('Start odometer must be a non-negative number');
  }
  if (isNaN(end) || end < 0) {
    errors.push('End odometer must be a non-negative number');
  }
  if (!isNaN(start) && !isNaN(end) && end <= start) {
    errors.push('End odometer must be greater than start odometer');
  }

  return { isValid: errors.length === 0, errors };
}
