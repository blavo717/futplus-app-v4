import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import AuthChoiceScreen from '../screens/auth/AuthChoiceScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';

export type AuthStackParamList = {
  AuthChoice: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ProfileSetup: undefined;
  EmailVerification: { email: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
        cardStyle: { backgroundColor: 'transparent' },
      }}
      initialRouteName="AuthChoice"
    >
      <Stack.Screen 
        name="AuthChoice" 
        component={AuthChoiceScreen}
        options={{
          ...TransitionPresets.FadeFromBottomAndroid,
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{
          ...TransitionPresets.ModalSlideFromBottomIOS,
        }}
      />
      <Stack.Screen 
        name="ProfileSetup" 
        component={ProfileSetupScreen}
        options={{
          ...TransitionPresets.FadeFromBottomAndroid,
          gestureEnabled: false, // Evitar volver atrás accidentalmente
        }}
      />
      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen}
        options={{
          ...TransitionPresets.ModalSlideFromBottomIOS,
          gestureEnabled: false, // No permitir volver sin verificar
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;