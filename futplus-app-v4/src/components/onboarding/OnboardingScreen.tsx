import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConfig } from '../../hooks/useConfig';
import { useDayZeroContent } from '../../hooks/useDayZero';
import GlassButton from './GlassButton';
import PageIndicator from './PageIndicator';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  backgroundImage: ImageSourcePropType;
  title?: string;
  subtitle?: string;
  buttonText: string;
  onPress: () => void;
  currentPage: number;
  totalPages: number;
  onSkip?: () => void;
  showLogo?: boolean;
  children?: React.ReactNode;
  isLastPage?: boolean;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  backgroundImage,
  title,
  subtitle,
  buttonText,
  onPress,
  currentPage,
  totalPages,
  onSkip,
  showLogo = false,
  children,
  isLastPage = false,
}) => {
  const { colors, getConfigValue } = useConfig();
  const { getWelcomeMessage, getCallToAction } = useDayZeroContent();

  // Obtener configuración dinámica de onboarding
  const onboardingConfig = getConfigValue('onboarding', {
    enabled: true,
    steps: [
      { id: 'welcome', title: 'Bienvenido', description: 'Descubre FutPlus', duration: 3000 },
      { id: 'training', title: 'Entrenamiento', description: 'Mejora tus habilidades', duration: 3000 },
      { id: 'nutrition', title: 'Nutrición', description: 'Alimentación optimizada', duration: 3000 },
      { id: 'community', title: 'Comunidad', description: 'Conecta con otros', duration: 3000 },
    ],
  });

  // Obtener contenido dinámico basado en el estado day-zero
  const welcomeMessage = getWelcomeMessage();
  const callToAction = getCallToAction();

  // Usar títulos dinámicos si no se proporcionan
  const dynamicTitle = title || welcomeMessage.title;
  const dynamicSubtitle = subtitle || welcomeMessage.subtitle;
  const dynamicButtonText = buttonText || callToAction.text;

  // Crear estilos dinámicos basados en la configuración
  const dynamicStyles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.overlay,
    },
    skipText: {
      color: colors.text.primary,
      fontSize: 16,
      opacity: 0.8,
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 18,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 26,
      opacity: 0.9,
    },
  });

  return (
    <ImageBackground source={backgroundImage} style={styles.backgroundImage} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={dynamicStyles.overlay} />
      
      <SafeAreaView style={styles.container}>
        {onSkip && !isLastPage && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={dynamicStyles.skipText}>Saltar</Text>
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          {showLogo && children}
          
          {dynamicTitle && (
            <View style={styles.textContainer}>
              <Text style={dynamicStyles.title}>{dynamicTitle}</Text>
              {dynamicSubtitle && <Text style={dynamicStyles.subtitle}>{dynamicSubtitle}</Text>}
            </View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <PageIndicator
            currentPage={currentPage}
            totalPages={totalPages}
            colors={colors}
          />
          <GlassButton
            title={dynamicButtonText}
            onPress={onPress}
            variant={isLastPage ? 'primary' : 'glass'}
            colors={colors}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  bottomContainer: {
    paddingBottom: 40,
  },
});

export default OnboardingScreen;