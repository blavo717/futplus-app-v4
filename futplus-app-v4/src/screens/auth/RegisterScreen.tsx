import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import GlassCard from '../../components/auth/GlassCard';
import GlassInput from '../../components/auth/GlassInput';
import GlassButton from '../../components/onboarding/GlassButton';
import GoogleButton from '../../components/auth/GoogleButton';
import AuthDivider from '../../components/auth/AuthDivider';
import PasswordStrength from '../../components/auth/PasswordStrength';
import FutPlusLogo from '../../components/onboarding/FutPlusLogo';
import { Colors } from '../../constants/colors';

type AuthStackParamList = {
  AuthChoice: undefined;
  Login: undefined;
  Register: undefined;
  ProfileSetup: undefined;
  EmailVerification: { email: string };
};

type RegisterNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Register'
>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavigationProp>();
  const { signUp, signInWithGoogle } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});
  const [showNotification, setShowNotification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!name) {
      newErrors.name = 'El nombre es requerido';
    } else if (name.length < 2) {
      newErrors.name = 'Mínimo 2 caracteres';
    }
    
    if (!email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'Debes aceptar los términos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await signUp({ email, password, name });
      
      // Mostrar notificación de éxito
      setRegisteredEmail(email);
      setShowNotification(true);
      
      // Scroll to top to ensure notification is visible
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      
      // La navegación a EmailVerificationScreen será manejada automáticamente por RootNavigator
      // No es necesario navegar manualmente
    } catch (error) {
      // El error ya se muestra en AuthContext
      // No hacer nada adicional, el error ya fue manejado
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      await signInWithGoogle();
      // La navegación se maneja automáticamente
    } catch (error) {
      // El error ya se muestra en AuthContext
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleResetApp = async () => {
    Alert.alert(
      'Reset App',
      '¿Estás seguro de que quieres borrar todos los datos locales y empezar desde cero?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert(
                'Reset Completado',
                'Por favor, cierra y vuelve a abrir la app para completar el reset.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Error resetting app:', error);
              Alert.alert('Error', 'No se pudo resetear la app');
            }
          }
        }
      ]
    );
  };

  return (
    <AuthLayout>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.devResetButton} 
              onPress={handleResetApp}
            >
              <Text style={styles.devResetText}>🔄 Reset App (DEV)</Text>
            </TouchableOpacity>
          )}
          
          {showNotification && (
            <GlassCard style={styles.notificationCard}>
              <Text style={styles.notificationTitle}>✓ ¡Registro exitoso!</Text>
              <Text style={styles.notificationText}>
                Se ha enviado un código de verificación a:{"\n"}
                <Text style={styles.notificationEmail}>{registeredEmail}</Text>
                {"\n\n"}Revisa tu correo e ingresa el código de 6 dígitos.
              </Text>
            </GlassCard>
          )}
          
          <View style={styles.header}>
            <FutPlusLogo size="medium" />
            <Text style={styles.title}>Únete a FutPlus</Text>
            <Text style={styles.subtitle}>
              Comienza tu entrenamiento profesional
            </Text>
          </View>

          <GlassCard>
            <GlassInput
              label="Nombre completo"
              icon="person"
              placeholder="Juan Pérez"
              value={name}
              onChangeText={setName}
              error={errors.name}
            />

            <GlassInput
              label="Email"
              icon="mail"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <GlassInput
              label="Contraseña"
              icon="lock-closed"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              error={errors.password}
            />

            {password && <PasswordStrength password={password} />}

            <GlassInput
              label="Confirmar contraseña"
              icon="lock-closed"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showPasswordToggle
              error={errors.confirmPassword}
            />

            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkboxInner, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  Acepto los{' '}
                  <Text style={styles.termsLink}>Términos y Condiciones</Text>
                  {' '}y la{' '}
                  <Text style={styles.termsLink}>Política de Privacidad</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
            </View>

            <GlassButton
              title={loading ? "Creando cuenta..." : "Crear Cuenta"}
              onPress={handleRegister}
              variant="primary"
            />
          </GlassCard>

          <AuthDivider text="O" />

          <GoogleButton
            title="Registrarse con Google"
            onPress={handleGoogleRegister}
            variant="glass"
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  termsContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxInner: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    color: Colors.text.secondary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 30,
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
  notificationCard: {
    marginBottom: 20,
    marginTop: 10,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderColor: 'rgba(46, 204, 113, 0.5)',
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 15,
    shadowColor: '#2ecc71',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  notificationText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationEmail: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
    textAlign: 'center',
  },
  devResetButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 68, 68, 0.9)',
    borderRadius: 20,
    zIndex: 999,
  },
  devResetText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;