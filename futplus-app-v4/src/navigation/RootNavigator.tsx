import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingNavigator from './OnboardingNavigator';
import AuthNavigator from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import PendingVerificationNavigator from './PendingVerificationNavigator';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import FutPlusLogo from '../components/onboarding/FutPlusLogo';

const ONBOARDING_KEY = '@futplus_onboarding_completed';

const RootNavigator: React.FC = () => {
  const { 
    isLoading: authLoading, 
    isAuthenticated, 
    needsProfile, 
    emailVerified,
    user,
    pendingEmailVerification,
    pendingEmail
  } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    // Listen for onboarding completion
    const interval = setInterval(async () => {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (value === 'true' && !hasCompletedOnboarding) {
        setHasCompletedOnboarding(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasCompletedOnboarding]);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(value === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.primary 
      }}>
        <FutPlusLogo size="medium" />
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Flujo de navegación actualizado:
  // 1. Si no ha completado onboarding -> OnboardingNavigator
  // 2. Si completó onboarding pero no está autenticado -> AuthNavigator
  // 3. Si está autenticado pero email no verificado -> EmailVerificationScreen
  // 4. Si está autenticado con email verificado pero necesita perfil -> ProfileSetupScreen
  // 5. Si está autenticado con email verificado y perfil completo -> TabNavigator

  if (!hasCompletedOnboarding) {
    return <OnboardingNavigator />;
  }

  // Si hay una verificación de email pendiente, mostrar el navigator de verificación
  if (pendingEmailVerification && pendingEmail) {
    return <PendingVerificationNavigator />;
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Si el usuario está autenticado pero el email no está verificado
  if (!emailVerified && user) {
    return <EmailVerificationScreen />;
  }

  if (needsProfile) {
    return <ProfileSetupScreen />;
  }

  return <TabNavigator />;
};

export default RootNavigator;