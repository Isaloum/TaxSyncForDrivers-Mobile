import {
  RECEIPT_CATEGORIES,
  EXPENSE_CATEGORIES,
  VEHICLE_RATES_2026,
  GST_RATE,
  QST_RATE,
  RETENTION_YEARS,
  LEGACY_CATEGORY_MAP,
} from '../src/constants/categories';

describe('RECEIPT_CATEGORIES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(RECEIPT_CATEGORIES)).toBe(true);
    expect(RECEIPT_CATEGORIES.length).toBeGreaterThan(0);
  });

  it('each category has key, label, and labelFr', () => {
    for (const cat of RECEIPT_CATEGORIES) {
      expect(cat).toHaveProperty('key');
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('labelFr');
      expect(typeof cat.key).toBe('string');
      expect(typeof cat.label).toBe('string');
      expect(typeof cat.labelFr).toBe('string');
    }
  });

  it('has unique keys', () => {
    const keys = RECEIPT_CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes core categories for rideshare drivers', () => {
    const keys = RECEIPT_CATEGORIES.map((c) => c.key);
    expect(keys).toContain('fuel');
    expect(keys).toContain('maintenance');
    expect(keys).toContain('insurance');
    expect(keys).toContain('other');
  });
});

describe('EXPENSE_CATEGORIES', () => {
  it('is a non-empty object', () => {
    expect(typeof EXPENSE_CATEGORIES).toBe('object');
    expect(Object.keys(EXPENSE_CATEGORIES).length).toBeGreaterThan(0);
  });

  it('each category has label, labelFr, code, and deductionRate', () => {
    for (const [key, cat] of Object.entries(EXPENSE_CATEGORIES)) {
      expect(cat).toHaveProperty('label');
      expect(cat).toHaveProperty('labelFr');
      expect(cat).toHaveProperty('code');
      expect(cat).toHaveProperty('deductionRate');
      expect(typeof cat.code).toBe('string');
      expect(cat.deductionRate).toBeGreaterThan(0);
      expect(cat.deductionRate).toBeLessThanOrEqual(1);
    }
  });

  it('meals & entertainment has 50% deduction rate', () => {
    expect(EXPENSE_CATEGORIES.MEALS_ENTERTAINMENT.deductionRate).toBe(0.5);
  });
});

describe('VEHICLE_RATES_2026', () => {
  it('has correct CRA simplified rates', () => {
    expect(VEHICLE_RATES_2026.first5000km).toBe(0.70);
    expect(VEHICLE_RATES_2026.after5000km).toBe(0.64);
    expect(VEHICLE_RATES_2026.territories).toBe(0.04);
  });
});

describe('Tax rates and constants', () => {
  it('GST rate is 5%', () => {
    expect(GST_RATE).toBe(0.05);
  });

  it('QST rate is 9.975%', () => {
    expect(QST_RATE).toBe(0.09975);
  });

  it('CRA retention is 6 years', () => {
    expect(RETENTION_YEARS).toBe(6);
  });
});

describe('LEGACY_CATEGORY_MAP', () => {
  it('maps old categories to new keys', () => {
    expect(LEGACY_CATEGORY_MAP.Gas).toBe('fuel');
    expect(LEGACY_CATEGORY_MAP.Maintenance).toBe('maintenance');
    expect(LEGACY_CATEGORY_MAP.Supplies).toBe('supplies');
    expect(LEGACY_CATEGORY_MAP.Other).toBe('other');
  });

  it('all mapped values are valid RECEIPT_CATEGORIES keys', () => {
    const validKeys = RECEIPT_CATEGORIES.map((c) => c.key);
    for (const mapped of Object.values(LEGACY_CATEGORY_MAP)) {
      expect(validKeys).toContain(mapped);
    }
  });
});
