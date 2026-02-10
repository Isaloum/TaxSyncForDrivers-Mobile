import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { LanguageProvider } from './src/i18n/LanguageContext';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </SafeAreaProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
