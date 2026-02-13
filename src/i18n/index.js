import translations from './translations';

/**
 * Retrieve a translated string by dot-separated key and language code.
 *
 * @param {string} key   - Dot-separated path, e.g. 'dashboard.title'
 * @param {string} [language='en'] - Language code ('en' or 'fr')
 * @returns {string} The translated string, or the English fallback, or the key itself
 *
 * @example
 *   t('dashboard.title', 'fr')    // 'Tableau de bord'
 *   t('common.error', 'en')       // 'Error'
 *   t('receipts.saving', 'fr')    // 'Enregistrement...'
 */
export function t(key, language = 'en') {
  const lang = translations[language] || translations.en;
  const fallback = translations.en;

  const parts = key.split('.');

  let value = lang;
  for (let i = 0; i < parts.length; i++) {
    if (value == null || typeof value !== 'object') {
      value = undefined;
      break;
    }
    value = value[parts[i]];
  }

  // If we found a string in the requested language, return it
  if (typeof value === 'string') {
    return value;
  }

  // Fall back to English
  let fallbackValue = fallback;
  for (let i = 0; i < parts.length; i++) {
    if (fallbackValue == null || typeof fallbackValue !== 'object') {
      fallbackValue = undefined;
      break;
    }
    fallbackValue = fallbackValue[parts[i]];
  }

  if (typeof fallbackValue === 'string') {
    return fallbackValue;
  }

  // If neither language has the key, return the key itself
  return key;
}

/**
 * Translate with interpolation support for {{key}} placeholders.
 *
 * @param {string} key - Dot-separated path
 * @param {string} language - Language code
 * @param {Object} params - Key-value pairs for interpolation
 * @returns {string}
 */
export function tWithParams(key, language = 'en', params = {}) {
  let result = t(key, language);
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
  }
  return result;
}

export { default as translations } from './translations';
