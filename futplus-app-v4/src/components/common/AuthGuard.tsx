import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

type RootStackParamList = {
  Auth: undefined;
  ProfileSetup: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireProfile = false }) => {
  const navigation = useNavigation<NavigationProp>();
  const { isLoading, isAuthenticated, needsProfile } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // No está autenticado, redirigir al auth
        navigation.navigate('Auth' as any);
      } else if (requireProfile && needsProfile) {
        // Necesita completar perfil
        navigation.navigate('ProfileSetup' as any);
      }
    }
  }, [isLoading, isAuthenticated, needsProfile, requireProfile, navigation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null; // Se está redirigiendo
  }

  if (requireProfile && needsProfile) {
    return null; // Se está redirigiendo
  }

  return <>{children}</>;
};

export default AuthGuard;