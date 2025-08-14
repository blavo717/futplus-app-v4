import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../components/auth/AuthLayout';
import GlassCard from '../../components/auth/GlassCard';
import GlassButton from '../../components/onboarding/GlassButton';
import GlassInput from '../../components/auth/GlassInput';
import FutPlusLogo from '../../components/onboarding/FutPlusLogo';
import { Colors } from '../../constants/colors';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

// Tipos de navegación que pueden usar esta pantalla
type AuthStackParamList = {
  AuthChoice: undefined;
  Login: undefined;
  Register: undefined;
  EmailVerification: { email: string };
};

type PendingVerificationStackParamList = {
  EmailVerification: { email: string };
  Register: undefined;
  Login: undefined;
};

// Union type para soportar ambos navigators
type EmailVerificationNavigationProp = StackNavigationProp<
  AuthStackParamList & PendingVerificationStackParamList,
  'EmailVerification'
>;

type EmailVerificationRouteProp = RouteProp<
  AuthStackParamList & PendingVerificationStackParamList,
  'EmailVerification'
>;

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<EmailVerificationNavigationProp>();
  const route = useRoute<EmailVerificationRouteProp>();
  const { pendingEmail, clearPendingVerification } = useAuth();
  
  // Obtener el email de los parámetros de la ruta o del contexto
  const email = route.params?.email || pendingEmail || '';
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [codeError, setCodeError] = useState('');
  const [isFirstCodeSent, setIsFirstCodeSent] = useState(false);

  useEffect(() => {
    // Cooldown timer
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    // Enviar código automáticamente cuando se monta el componente
    if (email && !isFirstCodeSent) {
      sendInitialCode();
    }
  }, [email, isFirstCodeSent]);

  const sendInitialCode = async () => {
    try {
      console.log('Enviando código inicial a:', email);
      await authService.sendVerificationCode(email);
      setIsFirstCodeSent(true);
      setCooldownSeconds(60); // Establecer cooldown inicial
      Alert.alert(
        'Código enviado',
        `Hemos enviado un código de verificación a ${email}. Por favor revisa tu bandeja de entrada.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Error enviando código inicial:', error);
      // Si hay error de rate limit, no mostrar alerta ya que el usuario puede reenviar manualmente
      if (!error.message?.includes('rate limit') && !error.message?.includes('Demasiadas solicitudes')) {
        Alert.alert(
          'Error',
          'No pudimos enviar el código de verificación. Por favor intenta reenviar.',
          [{ text: 'OK' }]
        );
      }
    }
  };


  const handleResendEmail = async () => {
    if (cooldownSeconds > 0) return;
    
    setIsResending(true);
    try {
      await authService.resendVerificationEmail(email);
      Alert.alert(
        'Código reenviado',
        'Se ha reenviado el código de verificación. Revisa tu bandeja de entrada.',
        [{ text: 'OK' }]
      );
      setCooldownSeconds(60); // 60 segundos de cooldown
    } catch (error: any) {
      // Manejar específicamente errores de rate limit
      if (error.message?.includes('rate limit') || error.message?.includes('Demasiadas solicitudes')) {
        Alert.alert(
          'Demasiadas solicitudes',
          'Has solicitado demasiados códigos. Por favor, espera unos minutos antes de intentar de nuevo.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'No se pudo reenviar el código. Intenta de nuevo más tarde.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setCodeError('Por favor ingresa el código de verificación');
      return;
    }

    if (verificationCode.length !== 6) {
      setCodeError('El código debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);
    setCodeError('');

    try {
      await authService.verifyEmailCode(email, verificationCode);
      
      Alert.alert(
        '¡Verificación exitosa!',
        'Tu email ha sido verificado correctamente. Ahora puedes iniciar sesión.',
        [
          {
            text: 'Iniciar sesión',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error: any) {
      setCodeError(error.message || 'Código inválido o expirado');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoToLogin = () => {
    // Limpiar el estado de verificación pendiente al ir a Login
    clearPendingVerification();
    navigation.navigate('Login');
  };

  const handleChangeEmail = () => {
    // Limpiar el estado de verificación pendiente al volver a Register
    clearPendingVerification();
    navigation.navigate('Register');
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <FutPlusLogo size="medium" />
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={60} color={Colors.accent} />
          </View>
          <Text style={styles.title}>Verifica tu Email</Text>
          <Text style={styles.subtitle}>
            Se ha enviado un código de verificación a:
          </Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <GlassCard style={styles.card}>
          <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={24} color={Colors.accent} />
                <Text style={styles.infoText}>
                  Por favor, revisa tu bandeja de entrada e ingresa el código de
                  verificación de 6 dígitos que hemos enviado a tu email.
                </Text>
              </View>

              <View style={{ marginBottom: 20 }}>
                <GlassInput
                  label="Código de verificación"
                  icon="key"
                  placeholder="123456"
                  value={verificationCode}
                  onChangeText={(text) => {
                    setVerificationCode(text.replace(/[^0-9]/g, ''));
                    setCodeError('');
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                  error={codeError}
                />
              </View>

              <GlassButton
                title={isVerifying ? "Verificando..." : "Verificar código"}
                onPress={handleVerifyCode}
                variant="primary"
              />

              <View style={styles.checklistContainer}>
                <Text style={styles.checklistTitle}>¿No recibiste el código?</Text>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.text.secondary} />
                  <Text style={styles.checklistText}>Revisa tu carpeta de spam</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.text.secondary} />
                  <Text style={styles.checklistText}>Verifica que el email sea correcto</Text>
                </View>
                <View style={styles.checklistItem}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.text.secondary} />
                  <Text style={styles.checklistText}>Espera unos minutos</Text>
                </View>
              </View>

              <GlassButton
                title={
                  isResending
                    ? "Enviando..."
                    : cooldownSeconds > 0
                      ? `Reenviar en ${cooldownSeconds}s`
                      : "Reenviar código"
                }
                onPress={handleResendEmail}
                variant="glass"
              />

          <TouchableOpacity
            style={styles.changeEmailButton}
            onPress={handleChangeEmail}
          >
            <Text style={styles.changeEmailText}>¿Email incorrecto? </Text>
            <Text style={styles.changeEmailLink}>Cambiar email</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={styles.footer}>
          <GlassButton
            title="Ya tengo cuenta"
            onPress={handleGoToLogin}
            variant="glass"
          />
          
          <Text style={styles.footerText}>
            Una vez verificado tu email, podrás acceder a tu cuenta
          </Text>
        </View>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  email: {
    fontSize: 18,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 5,
  },
  card: {
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.glass.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: Colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  checklistContainer: {
    marginBottom: 20,
  },
  checklistTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checklistText: {
    marginLeft: 8,
    color: Colors.text.secondary,
    fontSize: 14,
  },
  changeEmailButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  changeEmailText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  changeEmailLink: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

export default EmailVerificationScreen;