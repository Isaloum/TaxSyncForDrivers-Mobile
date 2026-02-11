import { LIGHT_COLORS, DARK_COLORS } from '../src/constants/darkTheme';

describe('LIGHT_COLORS', () => {
  it('has all required keys', () => {
    const requiredKeys = [
      'primary', 'primaryLight', 'background', 'card',
      'success', 'successLight', 'warning', 'warningLight',
      'danger', 'dangerLight', 'text', 'muted', 'mutedLight',
      'border', 'white', 'black', 'shadow', 'statusBar',
    ];
    for (const key of requiredKeys) {
      expect(LIGHT_COLORS).toHaveProperty(key);
    }
  });

  it('has light background', () => {
    expect(LIGHT_COLORS.background).toBe('#f8fafc');
  });

  it('has dark text for readability', () => {
    expect(LIGHT_COLORS.text).toBe('#0f172a');
  });

  it('statusBar is dark for light mode', () => {
    expect(LIGHT_COLORS.statusBar).toBe('dark');
  });
});

describe('DARK_COLORS', () => {
  it('has all required keys matching LIGHT_COLORS', () => {
    const lightKeys = Object.keys(LIGHT_COLORS).sort();
    const darkKeys = Object.keys(DARK_COLORS).sort();
    expect(darkKeys).toEqual(lightKeys);
  });

  it('has dark background', () => {
    expect(DARK_COLORS.background).toBe('#0f172a');
  });

  it('has light text for readability on dark bg', () => {
    expect(DARK_COLORS.text).toBe('#f1f5f9');
  });

  it('statusBar is light for dark mode', () => {
    expect(DARK_COLORS.statusBar).toBe('light');
  });

  it('card color is darker than light mode card', () => {
    // dark mode card should not be white
    expect(DARK_COLORS.card).not.toBe('#ffffff');
  });

  it('success colors are different from light mode', () => {
    expect(DARK_COLORS.successLight).not.toBe(LIGHT_COLORS.successLight);
  });
});

describe('Color contrast requirements', () => {
  it('light mode: text and background are different', () => {
    expect(LIGHT_COLORS.text).not.toBe(LIGHT_COLORS.background);
  });

  it('dark mode: text and background are different', () => {
    expect(DARK_COLORS.text).not.toBe(DARK_COLORS.background);
  });

  it('both modes have different primary tint', () => {
    // dark mode can use a lighter tint for visibility
    expect(DARK_COLORS.primary).not.toBe(LIGHT_COLORS.primary);
  });
});
