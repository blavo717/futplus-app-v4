import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NutricionScreen from '../../screens/NutricionScreen';
import { Colors } from '../../constants/colors';

export type NutricionStackParamList = {
  NutricionMain: undefined;
};

const Stack = createNativeStackNavigator<NutricionStackParamList>();

export const NutricionStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="NutricionMain"
        component={NutricionScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};