import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../services/storageService';
import { t as translate } from './index';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      if (settings.language) {
        setLanguageState(settings.language);
      }
    })();
  }, []);

  const setLanguage = useCallback(async (lang) => {
    setLanguageState(lang);
    await saveSettings({ language: lang });
  }, []);

  const t = useCallback((key) => translate(key, language), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
