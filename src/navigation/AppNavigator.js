import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, FONT_WEIGHTS } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';

import ReceiptsListScreen from '../screens/ReceiptsListScreen';
import ReceiptAddScreen from '../screens/ReceiptAddScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import CameraCaptureScreen from '../screens/CameraCaptureScreen';
import MileageListScreen from '../screens/MileageListScreen';
import MileageAddScreen from '../screens/MileageAddScreen';
import MileageDetailScreen from '../screens/MileageDetailScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const ReceiptsStack = createStackNavigator();
const MileageStack = createStackNavigator();
const DashboardStack = createStackNavigator();
const SettingsStack = createStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: FONT_WEIGHTS.bold },
};

function ReceiptsStackNavigator() {
  const { t } = useLanguage();
  return (
    <ReceiptsStack.Navigator screenOptions={stackScreenOptions}>
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
  return (
    <MileageStack.Navigator screenOptions={stackScreenOptions}>
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
    </MileageStack.Navigator>
  );
}

function DashboardStackNavigator() {
  const { t } = useLanguage();
  return (
    <DashboardStack.Navigator screenOptions={stackScreenOptions}>
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: t('dashboard.title') }}
      />
    </DashboardStack.Navigator>
  );
}

function SettingsStackNavigator() {
  const { t } = useLanguage();
  return (
    <SettingsStack.Navigator screenOptions={stackScreenOptions}>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: t('settings.title') }}
      />
    </SettingsStack.Navigator>
  );
}

function TabIcon({ label, focused }) {
  const icons = {
    Dashboard: focused ? '■' : '□',
    Receipts: focused ? '◆' : '◇',
    Mileage: focused ? '●' : '○',
    Settings: focused ? '▲' : '△',
  };
  return (
    <Text style={{ fontSize: 18, color: focused ? COLORS.primary : COLORS.muted }}>
      {icons[label] || '•'}
    </Text>
  );
}

export default function AppNavigator() {
  const { t } = useLanguage();
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopColor: COLORS.border,
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
              <TabIcon label="Dashboard" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="ReceiptsTab"
          component={ReceiptsStackNavigator}
          options={{
            title: t('receipts.title'),
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Receipts" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="MileageTab"
          component={MileageStackNavigator}
          options={{
            title: t('mileage.title'),
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Mileage" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            title: t('settings.title'),
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Settings" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
