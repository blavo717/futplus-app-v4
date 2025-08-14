import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

interface ProfileGuardProps {
  children: React.ReactNode;
}

type RootStackParamList = {
  ProfileSetup: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileGuard: React.FC<ProfileGuardProps> = ({ children }) => {
  const navigation = useNavigation<NavigationProp>();
  const { isLoading, isAuthenticated, needsProfile } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && needsProfile) {
      navigation.navigate('ProfileSetup' as any);
    }
  }, [isLoading, isAuthenticated, needsProfile, navigation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (needsProfile) {
    return null; // Se está redirigiendo
  }

  return <>{children}</>;
};

export default ProfileGuard;