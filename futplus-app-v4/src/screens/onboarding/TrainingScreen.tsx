import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';

type OnboardingStackParamList = {
  Welcome: undefined;
  Training: undefined;
  Nutrition: undefined;
  Community: undefined;
};

type TrainingScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Training'
>;

const TrainingScreen: React.FC = () => {
  const navigation = useNavigation<TrainingScreenNavigationProp>();

  const handleNext = () => {
    navigation.navigate('Nutrition');
  };

  const handleSkip = () => {
    navigation.navigate('Community');
  };

  return (
    <OnboardingScreen
      backgroundImage={require('../../../assets/onboarding/training-bg.jpg')}
      title="Entrena como un profesional"
      subtitle="Accede a videos y rutinas diseñadas por entrenadores de élite para mejorar tu técnica"
      buttonText="Siguiente"
      onPress={handleNext}
      currentPage={1}
      totalPages={4}
      onSkip={handleSkip}
    />
  );
};

export default TrainingScreen;