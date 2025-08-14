import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import { useAuth } from '../contexts/AuthContext';

export type PendingVerificationStackParamList = {
  EmailVerification: { email: string };
  Register: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<PendingVerificationStackParamList>();

const PendingVerificationNavigator: React.FC = () => {
  const { pendingEmail } = useAuth();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
        cardStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="EmailVerification"
    >
      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen}
        initialParams={{ email: pendingEmail || '' }}
        options={{
          ...TransitionPresets.ModalSlideFromBottomIOS,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
    </Stack.Navigator>
  );
};

export default PendingVerificationNavigator;