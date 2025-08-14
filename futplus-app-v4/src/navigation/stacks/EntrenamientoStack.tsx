import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EntrenamientoScreen from '../../screens/EntrenamientoScreen';
import { Colors } from '../../constants/colors';

export type EntrenamientoStackParamList = {
  EntrenamientoMain: undefined;
  EntrenamientoSession: undefined;
};

const Stack = createNativeStackNavigator<EntrenamientoStackParamList>();

export const EntrenamientoStack = () => {
  const TrainingSessionScreen = require('../../screens/TrainingSessionScreen').default;
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
        name="EntrenamientoMain"
        component={EntrenamientoScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EntrenamientoSession"
        component={TrainingSessionScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};