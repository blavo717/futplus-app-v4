import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import GlassCard from '../../components/auth/GlassCard';
import GlassInput from '../../components/auth/GlassInput';
import GlassButton from '../../components/onboarding/GlassButton';
import GoogleButton from '../../components/auth/GoogleButton';
import AuthDivider from '../../components/auth/AuthDivider';
import FutPlusLogo from '../../components/onboarding/FutPlusLogo';
import { Colors } from '../../constants/colors';

type AuthStackParamList = {
  AuthChoice: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ProfileSetup: undefined;
};

type LoginNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await signIn({ email, password, rememberMe });
      // La navegación se maneja automáticamente en RootNavigator
    } catch (error) {
      // El error ya se muestra en AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // La navegación se maneja automáticamente
    } catch (error) {
      // El error ya se muestra en AuthContext
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <AuthLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <FutPlusLogo size="medium" />
          <Text style={styles.title}>Bienvenido de vuelta</Text>
          <Text style={styles.subtitle}>
            Es hora de volver al campo
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
            error={errors.email}
          />

          <GlassInput
            label="Contraseña"
            icon="lock-closed"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            showPasswordToggle
            error={errors.password}
          />

          <View style={styles.rememberContainer}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkboxInner, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Mantener sesión iniciada</Text>
            </TouchableOpacity>
          </View>

          <GlassButton
            title={loading ? "Iniciando..." : "Iniciar Sesión"}
            onPress={handleLogin}
            variant="primary"
          />

          <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        </GlassCard>

        <AuthDivider text="O continúa con" />

        <GoogleButton
          title="Google"
          onPress={handleGoogleLogin}
          variant="glass"
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.footerLink}>Regístrate</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  rememberContainer: {
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rememberText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: Colors.accent,
    fontSize: 14,
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
});

export default LoginScreen;