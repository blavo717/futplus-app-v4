import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsistenciaScreen from '../../screens/AsistenciaScreen';
import { Colors } from '../../constants/colors';

export type AsistenciaStackParamList = {
  AsistenciaHome: undefined;
  Statistics: undefined;
  Achievements: undefined;
  Reports: undefined;
};

const Stack = createStackNavigator<AsistenciaStackParamList>();

const AsistenciaStack: React.FC = () => {
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
        name="AsistenciaHome" 
        component={AsistenciaScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* TODO: Agregar Statistics, Achievements y Reports cuando se implementen */}
    </Stack.Navigator>
  );
};

export default AsistenciaStack;