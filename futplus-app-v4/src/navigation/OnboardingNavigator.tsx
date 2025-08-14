import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigatorScreenParams } from '@react-navigation/native';

import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import TrainingScreen from '../screens/onboarding/TrainingScreen';
import NutritionScreen from '../screens/onboarding/NutritionScreen';
import CommunityScreen from '../screens/onboarding/CommunityScreen';

export type OnboardingStackParamList = {
  Welcome: undefined;
  Training: undefined;
  Nutrition: undefined;
  Community: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Training" component={TrainingScreen} />
      <Stack.Screen name="Nutrition" component={NutritionScreen} />
      <Stack.Screen name="Community" component={CommunityScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;