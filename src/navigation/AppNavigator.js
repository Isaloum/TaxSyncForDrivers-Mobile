import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, FONT_WEIGHTS } from '../constants/theme';

import ReceiptsListScreen from '../screens/ReceiptsListScreen';
import ReceiptAddScreen from '../screens/ReceiptAddScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
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
  return (
    <ReceiptsStack.Navigator screenOptions={stackScreenOptions}>
      <ReceiptsStack.Screen
        name="ReceiptsList"
        component={ReceiptsListScreen}
        options={{ title: 'Receipts' }}
      />
      <ReceiptsStack.Screen
        name="ReceiptAdd"
        component={ReceiptAddScreen}
        options={({ route }) => ({
          title: route.params?.editMode ? 'Edit Receipt' : 'Add Receipt',
        })}
      />
      <ReceiptsStack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{ title: 'Receipt Details' }}
      />
    </ReceiptsStack.Navigator>
  );
}

function MileageStackNavigator() {
  return (
    <MileageStack.Navigator screenOptions={stackScreenOptions}>
      <MileageStack.Screen
        name="MileageList"
        component={MileageListScreen}
        options={{ title: 'Mileage Log' }}
      />
      <MileageStack.Screen
        name="MileageAdd"
        component={MileageAddScreen}
        options={({ route }) => ({
          title: route.params?.editMode ? 'Edit Trip' : 'Log Trip',
        })}
      />
      <MileageStack.Screen
        name="MileageDetail"
        component={MileageDetailScreen}
        options={{ title: 'Trip Details' }}
      />
    </MileageStack.Navigator>
  );
}

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={stackScreenOptions}>
      <DashboardStack.Screen
        name="DashboardHome"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </DashboardStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={stackScreenOptions}>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
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
            title: 'Dashboard',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Dashboard" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="ReceiptsTab"
          component={ReceiptsStackNavigator}
          options={{
            title: 'Receipts',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Receipts" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="MileageTab"
          component={MileageStackNavigator}
          options={{
            title: 'Mileage',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Mileage" focused={focused} />
            ),
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStackNavigator}
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused }) => (
              <TabIcon label="Settings" focused={focused} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
