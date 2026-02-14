import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

import ReceiptsListScreen from '../screens/ReceiptsListScreen';
import ReceiptAddScreen from '../screens/ReceiptAddScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import CameraCaptureScreen from '../screens/CameraCaptureScreen';
import MileageListScreen from '../screens/MileageListScreen';
import MileageAddScreen from '../screens/MileageAddScreen';
import MileageDetailScreen from '../screens/MileageDetailScreen';
import GPSTrackingScreen from '../screens/GPSTrackingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsSettingsScreen from '../screens/NotificationsSettingsScreen';
import TaxSummaryScreen from '../screens/TaxSummaryScreen';
import CSVImportScreen from '../screens/CSVImportScreen';

const Tab = createBottomTabNavigator();
const ReceiptsStack = createStackNavigator();
const MileageStack = createStackNavigator();
const DashboardStack = createStackNavigator();
const SettingsStack = createStackNavigator();

function useStackScreenOptions() {
  const { colors } = useTheme();
  return {
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: '#ffffff',
    headerTitleStyle: { fontWeight: FONT_WEIGHTS.bold },
  };
}

function ReceiptsStackNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <ReceiptsStack.Navigator screenOptions={screenOptions}>
      <ReceiptsStack.Screen
        name="ReceiptsList"
        component={ReceiptsListScreen}
        options={{ title: t('receipts.title') }}
      />
      <ReceiptsStack.Screen
        name="ReceiptAdd"
        component={ReceiptAddScreen}
        options={({ route }) => ({
          title: route.params?.editMode ? t('receipts.editReceipt') : t('receipts.addReceipt'),
        })}
      />
      <ReceiptsStack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{ title: t('receipts.receiptDetails') }}
      />
      <ReceiptsStack.Screen
        name="CameraCapture"
        component={CameraCaptureScreen}
        options={{ title: t('dashboard.scan'), headerShown: false }}
      />
    </ReceiptsStack.Navigator>
  );
}

function MileageStackNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <MileageStack.Navigator screenOptions={screenOptions}>
      <MileageStack.Screen
        name="MileageList"
        component={MileageListScreen}
        options={{ title: t('mileage.title') }}
      />
      <MileageStack.Screen
        name="MileageAdd"
        component={MileageAddScreen}
        options={({ route }) => ({
          title: route.params?.editMode ? t('mileage.editTrip') : t('mileage.logTrip'),
        })}
      />
      <MileageStack.Screen
        name="MileageDetail"
        component={MileageDetailScreen}
        options={{ title: t('mileage.tripDetails') }}
      />
      <MileageStack.Screen
        name="GPSTracking"
        component={GPSTrackingScreen}
        options={{ title: t('gps.title') }}
      />
    </MileageStack.Navigator>
  );
}

function DashboardStackNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <DashboardStack.Navigator screenOptions={screenOptions}>
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: t('dashboard.title') }}
      />
      <DashboardStack.Screen
        name="TaxSummary"
        component={TaxSummaryScreen}
        options={{ title: t('taxSummary.title') }}
      />
    </DashboardStack.Navigator>
  );
}

function SettingsStackNavigator() {
  const { t } = useLanguage();
  const screenOptions = useStackScreenOptions();
  return (
    <SettingsStack.Navigator screenOptions={screenOptions}>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: t('settings.title') }}
      />
      <SettingsStack.Screen
        name="NotificationsSettings"
        component={NotificationsSettingsScreen}
        options={{ title: t('notifications.title') }}
      />
      <SettingsStack.Screen
        name="CSVImport"
        component={CSVImportScreen}
        options={{ title: t('csvImport.title') }}
      />
    </SettingsStack.Navigator>
  );
}

const TAB_ICONS = {
  Dashboard: { focused: 'grid', unfocused: 'grid-outline' },
  Receipts: { focused: 'receipt', unfocused: 'receipt-outline' },
  Mileage: { focused: 'car', unfocused: 'car-outline' },
  Settings: { focused: 'settings', unfocused: 'settings-outline' },
};

export default function AppNavigator() {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="DashboardTab"
          component={DashboardStackNavigator}
          options={{
            title: t('dashboard.title'),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? TAB_ICONS.Dashboard.focused : TAB_ICONS.Dashboard.unfocused}
                size={22}
                color={focused ? colors.primary : colors.muted}
              />
            ),
          }}
        />
        <Tab.Screen
          name="ReceiptsTab"
          component={ReceiptsStackNavigator}
          options={{
            title: t('receipts.title'),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? TAB_ICONS.Receipts.focused : TAB_ICONS.Receipts.unfocused}
                size={22}
                color={focused ? colors.primary : colors.muted}
              />
            ),
          }}
        />
        <Tab.Screen
          name="MileageTab"
          component={MileageStackNavigator}
          options={{
            title: t('mileage.title'),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? TAB_ICONS.Mileage.focused : TAB_ICONS.Mileage.unfocused}
                size={22}
                color={focused ? colors.primary : colors.muted}
              />
            ),
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            title: t('settings.title'),
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? TAB_ICONS.Settings.focused : TAB_ICONS.Settings.unfocused}
                size={22}
                color={focused ? colors.primary : colors.muted}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
