import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import GlassCard from '../../components/auth/GlassCard';
import GlassInput from '../../components/auth/GlassInput';
import GlassButton from '../../components/onboarding/GlassButton';
import FutPlusLogo from '../../components/onboarding/FutPlusLogo';
import { Colors } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

type ForgotPasswordNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = () => {
    if (!email) {
      setError('El email es requerido');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email inválido');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    
    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error) {
      // El error ya se muestra en AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  if (emailSent) {
    return (
      <AuthLayout>
        <View style={styles.container}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={80} color={Colors.accent} />
            </View>
            <Text style={styles.successTitle}>¡Email enviado!</Text>
            <Text style={styles.successText}>
              Hemos enviado las instrucciones para restablecer tu contraseña a:
            </Text>
            <Text style={styles.emailText}>{email}</Text>
            <Text style={styles.instructionText}>
              Revisa tu bandeja de entrada y sigue las instrucciones. 
              Si no lo ves, revisa tu carpeta de spam.
            </Text>
            
            <GlassButton
              title="Volver al inicio"
              onPress={handleBackToLogin}
              variant="primary"
              style={styles.button}
            />
          </View>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
          <Ionicons name="arrow-back" size={24} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <FutPlusLogo size="small" />
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            No te preocupes, te enviaremos instrucciones para restablecerla
          </Text>
        </View>

        <GlassCard>
          <GlassInput
            label="Email"
            icon="mail"
            placeholder="tu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={error}
          />

          <GlassButton
            title={loading ? "Enviando..." : "Enviar instrucciones"}
            onPress={handleResetPassword}
            variant="primary"
          />
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Recordaste tu contraseña? </Text>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
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
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  emailText: {
    fontSize: 18,
    color: Colors.accent,
    fontWeight: '600',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 14,
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  button: {
    width: '100%',
  },
});

export default ForgotPasswordScreen;