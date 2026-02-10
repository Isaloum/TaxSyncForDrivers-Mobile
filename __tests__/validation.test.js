import { validateReceipt, validateTrip } from '../src/utils/validation';

describe('validateReceipt', () => {
  it('passes with valid data', () => {
    const result = validateReceipt({
      amount: '25.50',
      date: '2026-02-08',
      category: 'fuel',
      vendor: 'Shell',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when amount is missing', () => {
    const result = validateReceipt({ amount: '', date: '2026-02-08' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Amount is required');
  });

  it('fails when amount is negative', () => {
    const result = validateReceipt({ amount: '-5', date: '2026-02-08' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Amount must be a positive number');
  });

  it('fails when amount is not a number', () => {
    const result = validateReceipt({ amount: 'abc', date: '2026-02-08' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Amount must be a positive number');
  });

  it('fails when date is missing', () => {
    const result = validateReceipt({ amount: '10', date: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Date is required');
  });

  it('fails when date is invalid', () => {
    const result = validateReceipt({ amount: '10', date: 'not-a-date' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid date');
  });

  it('fails when date is in the future', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = validateReceipt({
      amount: '10',
      date: futureDate.toISOString().split('T')[0],
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Date cannot be in the future');
  });

  it('fails with invalid category', () => {
    const result = validateReceipt({
      amount: '10',
      date: '2026-02-08',
      category: 'INVALID',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid category');
  });

  it('allows empty vendor', () => {
    const result = validateReceipt({
      amount: '10',
      date: '2026-02-08',
      vendor: '',
    });
    expect(result.isValid).toBe(true);
  });
});

describe('validateTrip', () => {
  it('passes with valid data', () => {
    const result = validateTrip({
      date: '2026-02-08',
      destination: 'Office',
      purpose: 'Meeting',
      startOdometer: '10000',
      endOdometer: '10042',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when destination is empty', () => {
    const result = validateTrip({
      date: '2026-02-08',
      destination: '',
      purpose: 'Work',
      startOdometer: '100',
      endOdometer: '200',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Destination is required');
  });

  it('fails when purpose is empty', () => {
    const result = validateTrip({
      date: '2026-02-08',
      destination: 'Office',
      purpose: '',
      startOdometer: '100',
      endOdometer: '200',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Purpose is required');
  });

  it('fails when end odometer is less than start', () => {
    const result = validateTrip({
      date: '2026-02-08',
      destination: 'Office',
      purpose: 'Work',
      startOdometer: '200',
      endOdometer: '100',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('End odometer must be greater than start odometer');
  });

  it('fails with negative odometer', () => {
    const result = validateTrip({
      date: '2026-02-08',
      destination: 'Office',
      purpose: 'Work',
      startOdometer: '-10',
      endOdometer: '100',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Start odometer must be a non-negative number');
  });
});
