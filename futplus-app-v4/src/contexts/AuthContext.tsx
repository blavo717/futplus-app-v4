import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import authService from '../services/authService';
import { 
  User, 
  Profile, 
  AuthState, 
  LoginCredentials, 
  RegisterCredentials 
} from '../types/auth.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isProfileComplete = (profile: Profile): boolean => {
  return !!(profile.name && profile.position && profile.age && profile.level && profile.objective);
};

interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: RegisterCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (profileData: Partial<Profile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  handleEmailVerificationDeepLink: () => Promise<boolean>;
  pendingEmailVerification: boolean;
  pendingEmail: string | null;
  clearPendingVerification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    needsProfile: false,
    emailVerified: false,
  });
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);

  // Cargar usuario al iniciar la app
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const userData = await authService.getCurrentUser();
      
      if (userData) {
        // Verificar si el email está verificado
        const emailVerified = await authService.checkEmailVerified();
        
        setState({
          user: userData.user,
          profile: userData.profile,
          isLoading: false,
          isAuthenticated: emailVerified,
          needsProfile: emailVerified && !userData.profile?.position,
          emailVerified,
        });
      } else {
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          needsProfile: false,
          emailVerified: false,
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        needsProfile: false,
        emailVerified: false,
      });
      
      // Limpiar el estado de verificación pendiente
      setPendingEmailVerification(false);
      setPendingEmail(null);
    }
  };

  const signIn = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { user, profile } = await authService.signIn(credentials);
      
      // Verificar si el email está verificado después de iniciar sesión
      const emailVerified = await authService.checkEmailVerified();
      
      if (!emailVerified) {
        // Cerrar sesión si el email no está verificado
        await authService.signOut();
        setState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          needsProfile: false,
          emailVerified: false,
        });
        // Guardar el email para la pantalla de verificación
        setPendingEmail(credentials.email);
        throw new Error('Por favor verifica tu email antes de iniciar sesión');
      }
      
      setState({
        user,
        profile,
        isLoading: false,
        isAuthenticated: true,
        needsProfile: !profile?.position,
        emailVerified: true,
      });
      
      // Limpiar el estado de verificación pendiente
      setPendingEmailVerification(false);
      setPendingEmail(null);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
      throw error;
    }
  };

  const signUp = async (credentials: RegisterCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { user, profile } = await authService.signUp(credentials);
      
      // Guardar el email para la pantalla de verificación
      setPendingEmail(credentials.email);
      setPendingEmailVerification(true);
      
      // No marcar como autenticado hasta que verifique el email
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        needsProfile: false,
        emailVerified: false,
      });
      
      // La navegación será manejada automáticamente por RootNavigator
      // NO limpiar pendingEmailVerification aquí - debe mantenerse para que RootNavigator lo detecte
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      setPendingEmailVerification(false);
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      await authService.signOut();
      
      // Limpiar AsyncStorage
      await AsyncStorage.removeItem('@futplus_onboarding_completed');
      
      setState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        needsProfile: false,
        emailVerified: false,
      });
      
      // Limpiar el estado de verificación pendiente
      setPendingEmailVerification(false);
      setPendingEmail(null);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      Alert.alert('Error', error.message || 'No se pudo cerrar sesión');
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Iniciar flujo OAuth con Google
      const { user, profile } = await authService.signInWithGoogle();
      
      // Actualizar el estado con el usuario autenticado
      setState({
        isLoading: false,
        isAuthenticated: true,
        user,
        profile,
        needsProfile: !profile || !isProfileComplete(profile),
        emailVerified: true, // Google siempre verifica el email
      });
      
      // Si no hay perfil o está incompleto, se navegará a ProfileSetup
      // La navegación es manejada por RootNavigator basándose en needsProfile
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Solo mostrar alerta si no fue cancelado por el usuario
      if (!error.message?.includes('cancelada')) {
        Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Google');
      }
      
      throw error;
    }
  };

  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error('No hay usuario autenticado');
      
      setState(prev => ({ ...prev, isLoading: true }));
      
      let updatedProfile: Profile;
      
      if (state.profile) {
        // Actualizar perfil existente
        updatedProfile = await authService.updateProfile(state.user.id, profileData);
      } else {
        // Crear nuevo perfil
        updatedProfile = await authService.createProfile(state.user.id, profileData);
      }
      
      setState(prev => ({
        ...prev,
        profile: updatedProfile,
        isLoading: false,
        needsProfile: !updatedProfile.position,
        emailVerified: prev.emailVerified,
      }));
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
      Alert.alert(
        'Email enviado',
        'Revisa tu bandeja de entrada para restablecer tu contraseña'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el email');
      throw error;
    }
  };

  const refreshAuth = async () => {
    try {
      await authService.refreshSession();
      await checkAuthStatus();
    } catch (error) {
      console.error('Error refreshing auth:', error);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      await authService.resendVerificationEmail(email);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo reenviar el email');
      throw error;
    }
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    try {
      const verified = await authService.checkEmailVerified();
      
      // Actualizar el estado si el email está verificado
      if (verified && state.user) {
        setState(prev => ({
          ...prev,
          emailVerified: true,
          isAuthenticated: true,
          needsProfile: !prev.profile?.position,
        }));
      }
      
      return verified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  // Handle deep link navigation for email verification
  const handleEmailVerificationDeepLink = async () => {
    try {
      // Force refresh session and check verification status
      await authService.refreshSession();
      
      // Get current user data
      const userData = await authService.getCurrentUser();
      
      if (userData) {
        // Check email verification status
        const emailVerified = await authService.checkEmailVerified();
        
        if (emailVerified) {
          // Get updated profile
          let profile = userData.profile;
          if (!profile) {
            profile = await authService.getProfile(userData.user.id);
          }
          
          setState({
            user: userData.user,
            profile,
            isLoading: false,
            isAuthenticated: true,
            needsProfile: !profile?.position,
            emailVerified: true,
          });
          
          // Limpiar el estado de verificación pendiente
          setPendingEmailVerification(false);
          setPendingEmail(null);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error handling email verification deep link:', error);
      return false;
    }
  };

  const clearPendingVerification = () => {
    setPendingEmailVerification(false);
    setPendingEmail(null);
  };

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateProfile,
    resetPassword,
    refreshAuth,
    resendVerificationEmail,
    checkEmailVerified,
    handleEmailVerificationDeepLink,
    pendingEmailVerification,
    pendingEmail,
    clearPendingVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;