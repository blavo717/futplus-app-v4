import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';
import FutPlusLogo from '../../components/onboarding/FutPlusLogo';
import { Colors } from '../../constants/colors';

type OnboardingStackParamList = {
  Welcome: undefined;
  Training: undefined;
  Nutrition: undefined;
  Community: undefined;
};

type WelcomeScreenNavigationProp = StackNavigationProp<
  OnboardingStackParamList,
  'Welcome'
>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleNext = () => {
    navigation.navigate('Training');
  };

  const handleSkip = () => {
    navigation.navigate('Community');
  };

  return (
    <OnboardingScreen
      backgroundImage={require('../../../assets/onboarding/welcome-bg.jpg')}
      buttonText="Siguiente"
      onPress={handleNext}
      currentPage={0}
      totalPages={4}
      onSkip={handleSkip}
      showLogo={true}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.welcomeText}>Bienvenido a</Text>
        <FutPlusLogo size="large" />
      </View>
    </OnboardingScreen>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    color: Colors.text.primary,
    marginBottom: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;