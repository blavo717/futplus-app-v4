import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DashboardScreen from '../../screens/DashboardScreen';
import { Colors } from '../../constants/colors';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  VideoDetail: { videoId: string };
  TrainingDetail: { trainingId: string };
};

const Stack = createStackNavigator<DashboardStackParamList>();

const DashboardStack: React.FC = () => {
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
        name="DashboardHome" 
        component={DashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* TODO: Agregar VideoDetail y TrainingDetail cuando se implementen */}
    </Stack.Navigator>
  );
};

export default DashboardStack;