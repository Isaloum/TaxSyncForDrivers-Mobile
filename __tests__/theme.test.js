import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  CHART_COLORS,
} from '../src/constants/theme';

describe('COLORS', () => {
  it('has all required color keys', () => {
    const requiredKeys = [
      'primary', 'primaryLight', 'background', 'card',
      'success', 'successLight', 'warning', 'warningLight',
      'danger', 'dangerLight', 'text', 'muted', 'mutedLight',
      'border', 'white', 'black',
    ];
    for (const key of requiredKeys) {
      expect(COLORS).toHaveProperty(key);
    }
  });

  it('all values are valid hex color strings', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const [key, value] of Object.entries(COLORS)) {
      expect(value).toMatch(hexRegex);
    }
  });

  it('white is #ffffff and black is #000000', () => {
    expect(COLORS.white).toBe('#ffffff');
    expect(COLORS.black).toBe('#000000');
  });
});

describe('SPACING', () => {
  it('values increase in order', () => {
    expect(SPACING.xs).toBeLessThan(SPACING.sm);
    expect(SPACING.sm).toBeLessThan(SPACING.md);
    expect(SPACING.md).toBeLessThan(SPACING.lg);
    expect(SPACING.lg).toBeLessThan(SPACING.xl);
    expect(SPACING.xl).toBeLessThan(SPACING.xxl);
  });

  it('all values are positive numbers', () => {
    for (const value of Object.values(SPACING)) {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    }
  });
});

describe('BORDER_RADIUS', () => {
  it('values increase in order', () => {
    expect(BORDER_RADIUS.sm).toBeLessThanOrEqual(BORDER_RADIUS.md);
    expect(BORDER_RADIUS.md).toBeLessThanOrEqual(BORDER_RADIUS.lg);
    expect(BORDER_RADIUS.lg).toBeLessThanOrEqual(BORDER_RADIUS.xl);
  });
});

describe('FONT_SIZES', () => {
  it('has standard size scale', () => {
    expect(FONT_SIZES.xs).toBeLessThan(FONT_SIZES.sm);
    expect(FONT_SIZES.sm).toBeLessThan(FONT_SIZES.md);
    expect(FONT_SIZES.md).toBeLessThan(FONT_SIZES.lg);
    expect(FONT_SIZES.lg).toBeLessThan(FONT_SIZES.xl);
    expect(FONT_SIZES.xl).toBeLessThan(FONT_SIZES.title);
  });
});

describe('FONT_WEIGHTS', () => {
  it('has standard weight values', () => {
    expect(FONT_WEIGHTS.regular).toBe('400');
    expect(FONT_WEIGHTS.medium).toBe('500');
    expect(FONT_WEIGHTS.semibold).toBe('600');
    expect(FONT_WEIGHTS.bold).toBe('700');
  });
});

describe('CHART_COLORS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CHART_COLORS)).toBe(true);
    expect(CHART_COLORS.length).toBeGreaterThanOrEqual(5);
  });

  it('contains valid hex colors', () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const color of CHART_COLORS) {
      expect(color).toMatch(hexRegex);
    }
  });
});
