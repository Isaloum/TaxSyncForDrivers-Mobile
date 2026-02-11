import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getSettings, saveSettings } from '../services/storageService';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/darkTheme';

// 'light', 'dark', or 'system'
const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [themePref, setThemePref] = useState('light'); // 'light' | 'dark' | 'system'

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      if (settings.theme) {
        setThemePref(settings.theme);
      }
    })();
  }, []);

  const setTheme = useCallback(async (value) => {
    setThemePref(value);
    await saveSettings({ theme: value });
  }, []);

  const resolvedDark =
    themePref === 'system'
      ? systemScheme === 'dark'
      : themePref === 'dark';

  const colors = resolvedDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ theme: themePref, isDark: resolvedDark, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { LIGHT_COLORS, DARK_COLORS };
