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

type NutritionScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Nutrition'
>;

const NutritionScreen: React.FC = () => {
  const navigation = useNavigation<NutritionScreenNavigationProp>();

  const handleNext = () => {
    navigation.navigate('Community');
  };

  const handleSkip = () => {
    navigation.navigate('Community');
  };

  return (
    <OnboardingScreen
      backgroundImage={require('../../../assets/onboarding/nutrition-bg.jpg')}
      title="Nutrición de alto rendimiento"
      subtitle="Planes nutricionales personalizados para maximizar tu potencial físico"
      buttonText="Siguiente"
      onPress={handleNext}
      currentPage={2}
      totalPages={4}
      onSkip={handleSkip}
    />
  );
};

export default NutritionScreen;