import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

interface AuthLayoutProps {
  children: React.ReactNode;
  backgroundImage?: any;
}

const { height } = Dimensions.get('window');

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  backgroundImage 
}) => {
  const defaultBackground = require('../../../assets/onboarding/training-bg.jpg');
  
  return (
    <ImageBackground
      source={backgroundImage || defaultBackground}
      style={styles.container}
      resizeMode="cover"
    >
      <LinearGradient
        colors={[
          'rgba(91, 33, 182, 0.8)',
          'rgba(91, 33, 182, 0.6)',
          'rgba(0, 0, 0, 0.7)'
        ]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height * 0.9,
  },
});

export default AuthLayout;