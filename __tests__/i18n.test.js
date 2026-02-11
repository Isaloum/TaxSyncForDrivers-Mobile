import { t, translations } from '../src/i18n/index';

describe('t() translation function', () => {
  it('returns English string by default', () => {
    expect(t('dashboard.title')).toBe('Dashboard');
  });

  it('returns French string when language is fr', () => {
    expect(t('dashboard.title', 'fr')).toBe('Tableau de bord');
  });

  it('returns English fallback for unknown language', () => {
    expect(t('dashboard.title', 'de')).toBe('Dashboard');
  });

  it('returns key when key does not exist', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('returns key for deeply nested nonexistent path', () => {
    expect(t('a.b.c.d.e')).toBe('a.b.c.d.e');
  });

  it('resolves nested keys correctly', () => {
    expect(t('receipts.amount', 'en')).toBe('Amount ($)');
    expect(t('receipts.amount', 'fr')).toBe('Montant ($)');
  });

  it('handles common namespace', () => {
    expect(t('common.error', 'en')).toBe('Error');
    expect(t('common.error', 'fr')).toBe('Erreur');
  });

  it('handles mileage namespace', () => {
    expect(t('mileage.business', 'en')).toBe('Business');
    expect(t('mileage.business', 'fr')).toBe('Affaires');
  });

  it('handles settings namespace', () => {
    expect(t('settings.province', 'en')).toBe('Province');
    expect(t('settings.province', 'fr')).toBe('Province');
  });
});

describe('translations object', () => {
  it('has en and fr locales', () => {
    expect(translations).toHaveProperty('en');
    expect(translations).toHaveProperty('fr');
  });

  it('has matching top-level keys in both languages', () => {
    const enKeys = Object.keys(translations.en).sort();
    const frKeys = Object.keys(translations.fr).sort();
    expect(enKeys).toEqual(frKeys);
  });

  it('has matching second-level keys for each namespace', () => {
    const namespaces = Object.keys(translations.en);
    for (const ns of namespaces) {
      const enKeys = Object.keys(translations.en[ns]).sort();
      const frKeys = Object.keys(translations.fr[ns]).sort();
      expect(enKeys).toEqual(frKeys);
    }
  });

  it('has no empty string values in English', () => {
    const namespaces = Object.keys(translations.en);
    for (const ns of namespaces) {
      const keys = Object.keys(translations.en[ns]);
      for (const k of keys) {
        expect(translations.en[ns][k]).not.toBe('');
      }
    }
  });

  it('has no empty string values in French', () => {
    const namespaces = Object.keys(translations.fr);
    for (const ns of namespaces) {
      const keys = Object.keys(translations.fr[ns]);
      for (const k of keys) {
        expect(translations.fr[ns][k]).not.toBe('');
      }
    }
  });
});
