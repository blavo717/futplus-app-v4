import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';

const ONBOARDING_KEY = '@futplus_onboarding_completed';

const CommunityScreen: React.FC = () => {
  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      // Navigation to main app will be handled by RootNavigator
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  return (
    <OnboardingScreen
      backgroundImage={require('../../../assets/onboarding/community-bg.jpg')}
      title="Una comunidad, mismo sueño"
      subtitle="Conecta con futbolistas de toda España y comparte tu progreso"
      buttonText="Comenzar"
      onPress={handleComplete}
      currentPage={3}
      totalPages={4}
      isLastPage={true}
    />
  );
};

export default CommunityScreen;