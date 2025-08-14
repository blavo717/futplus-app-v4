import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PerfilScreen from '../../screens/PerfilScreen';
import { Colors } from '../../constants/colors';

export type PerfilStackParamList = {
  PerfilHome: undefined;
  EditProfile: undefined;
  Subscription: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<PerfilStackParamList>();

const PerfilStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="PerfilHome" 
        component={PerfilScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* TODO: Agregar EditProfile, Subscription y Settings cuando se implementen */}
    </Stack.Navigator>
  );
};

export default PerfilStack;