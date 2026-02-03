import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ReceiptsListScreen from '../screens/ReceiptsListScreen';
import ReceiptAddScreen from '../screens/ReceiptAddScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Receipts" component={ReceiptsListScreen} />
        <Stack.Screen name="ReceiptAdd" component={ReceiptAddScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
