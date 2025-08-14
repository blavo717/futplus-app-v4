import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import GlassButton from '../../components/onboarding/GlassButton';
import GoogleButton from '../../components/auth/GoogleButton';
import FutPlusLogo from '../../components/onboarding/FutPlusLogo';
import { Colors } from '../../constants/colors';

type AuthStackParamList = {
  AuthChoice: undefined;
  Login: undefined;
  Register: undefined;
  ProfileSetup: undefined;
};

type AuthChoiceNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'AuthChoice'
>;

const AuthChoiceScreen: React.FC = () => {
  const navigation = useNavigation<AuthChoiceNavigationProp>();
  const { signInWithGoogle } = useAuth();

  const handleGoogleAuth = async () => {
    try {
      await signInWithGoogle();
      // La navegación se maneja automáticamente
    } catch (error) {
      // El error ya se muestra en AuthContext
    }
  };

  const handleEmailRegister = () => {
    navigation.navigate('Register');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <View style={styles.logoSection}>
          <FutPlusLogo size="large" />
          <Text style={styles.title}>Comienza tu viaje futbolístico</Text>
          <Text style={styles.subtitle}>
            Entrena como un profesional, mejora cada día
          </Text>
        </View>

        <View style={styles.buttonsSection}>
          <GoogleButton
            title="Continuar con Google"
            onPress={handleGoogleAuth}
            variant="primary"
          />
          
          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>O</Text>
            <View style={styles.orLine} />
          </View>

          <GlassButton
            title="Registrarse con Email"
            onPress={handleEmailRegister}
            variant="glass"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.terms}>
          Al continuar, aceptas nuestros{' '}
          <Text style={styles.termsLink}>Términos y Condiciones</Text>
          {' '}y{' '}
          <Text style={styles.termsLink}>Política de Privacidad</Text>
        </Text>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  buttonsSection: {
    marginTop: 40,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 60,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.glass.border,
  },
  orText: {
    color: Colors.text.muted,
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footerText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  footerLink: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    color: Colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 20,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
});

export default AuthChoiceScreen;