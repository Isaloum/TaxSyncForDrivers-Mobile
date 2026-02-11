import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import OnboardingScreen from './src/screens/OnboardingScreen';

const ONBOARDING_KEY = 'taxsync_onboarding_complete';

function AppContent() {
  const { isDark } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(null); // null = loading

  useEffect(() => {
    (async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      setShowOnboarding(done !== 'true');
    })();
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  // Still loading onboarding preference
  if (showOnboarding === null) return null;

  if (showOnboarding) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <AppContent />
          </SafeAreaProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
