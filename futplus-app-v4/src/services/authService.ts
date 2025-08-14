import { supabase } from '../config/supabase';
import {
  User,
  Profile,
  LoginCredentials,
  RegisterCredentials,
  AuthError
} from '../types/auth.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import ConfigService from '../config/configService';

const REMEMBER_ME_KEY = '@futplus_remember_me';

class AuthService {
  /**
   * IMPORTANTE: Comportamiento con Email Confirmation activado en Supabase:
   * 
   * 1. Al registrarse (signUp):
   *    - El usuario se crea pero NO tiene sesión activa
   *    - getUser() retornará null
   *    - El usuario NO aparece en Supabase Dashboard
   * 
   * 2. Al verificar el email (verifyEmailCode):
   *    - Se activa la sesión del usuario
   *    - El usuario aparece en Supabase Dashboard
   *    - Se puede acceder con getUser() y getSession()
   * 
   * Este es el comportamiento esperado y seguro de Supabase.
   */

  // Email/Password Authentication
  async signUp(credentials: RegisterCredentials): Promise<{ user: User; profile: Profile | null }> {
    try {
      // Log de configuración de Supabase
      console.log('Intentando crear usuario en Supabase...');
      console.log('URL del proyecto:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      
      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name, // Pasar el nombre para el trigger
          },
          emailRedirectTo: undefined, // No usar redirección, usaremos OTP
        }
      });

      // Log completo de la respuesta
      console.log('Respuesta de signUp:', {
        data: authData,
        error: authError,
        hasUser: !!authData?.user,
        userId: authData?.user?.id
      });

      if (authError) {
        console.error('Error en signUp:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        console.error('signUp no retornó usuario');
        throw new Error('No se pudo crear el usuario');
      }
      
      // Validar que el ID del usuario es válido
      if (!authData.user.id || authData.user.id.length !== 36) {
        console.error('ID de usuario inválido:', authData.user.id);
        throw new Error('ID de usuario inválido');
      }
      
      // Log para debug
      console.log('Usuario creado exitosamente:', {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at,
        createdAt: authData.user.created_at
      });
      
      // NOTA IMPORTANTE: Con email confirmation activado en Supabase:
      // - El usuario NO tendrá sesión activa hasta verificar el email
      // - getUser() retornará null hasta la verificación
      // - El usuario NO aparecerá en el dashboard hasta confirmar el email
      // Esto es el comportamiento esperado y seguro de Supabase

      // NO enviamos OTP automáticamente aquí
      // El código se enviará cuando el usuario llegue a EmailVerificationScreen
      // Esto evita problemas de rate limit si el usuario se registra múltiples veces
      
      // No intentamos crear el perfil aquí, el trigger lo hará
      // Y el usuario debe verificar su email primero con el código
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          created_at: authData.user.created_at,
        },
        profile: null, // No retornamos perfil hasta después de verificación
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signIn(credentials: LoginCredentials): Promise<{ user: User; profile: Profile | null }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo iniciar sesión');

      // Guardar preferencia de "recordar sesión"
      if (credentials.rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
      }

      // Obtener perfil del usuario
      let profile = await this.getProfile(authData.user.id);

      // Si no existe perfil, crear uno básico (después de verificación)
      if (!profile) {
        // Verificar si el email está verificado antes de crear perfil
        const { data: isVerified } = await supabase
          .rpc('is_email_verified', { user_uuid: authData.user.id });
        
        if (isVerified) {
          // Crear perfil básico con datos del auth
          const { data: authUser } = await supabase.auth.getUser();
          const userMetadata = authUser.user?.user_metadata || {};
          
          // Obtener valores por defecto de la configuración
          const configService = ConfigService.getInstance();
          const userDefaults = configService.getUserDefaults();
          
          profile = await this.createProfile(authData.user.id, {
            name: userMetadata.name || authData.user.email?.split('@')[0] || 'Usuario',
            position: userDefaults.position,
            age: userDefaults.age,
            level: userDefaults.level,
            objective: userDefaults.objective,
            avatar_url: undefined,
          });
        }
      }

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          created_at: authData.user.created_at,
        },
        profile,
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar storage local
      await AsyncStorage.removeItem(REMEMBER_ME_KEY);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'futplus://reset-password', // Deep link para la app
      });
      
      if (error) throw error;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Email Verification - OTP System
  async sendVerificationCode(email: string): Promise<void> {
    try {
      // Este método se usa para REENVIAR el código, no para el primer envío
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false, // Usuario ya debe existir
        }
      });
      
      if (error) throw error;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async verifyEmailCode(email: string, code: string): Promise<void> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: code,
        type: 'email'
      });
      
      if (error) throw error;
      
      // Si la verificación es exitosa, el usuario ya está autenticado
      console.log('Verificación OTP exitosa');
      
      // Ahora sí debería haber una sesión activa
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Usuario después de verificación:', user ? `Usuario activo: ${user.email}` : 'ERROR: Usuario no encontrado');
      
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sesión después de verificación:', session ? 'Sesión activa' : 'ERROR: Sin sesión');
      
      // El usuario ahora debería aparecer en Supabase Dashboard
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    try {
      // Usar el nuevo sistema de OTP
      await this.sendVerificationCode(email);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async checkEmailVerified(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Verificar si el email está confirmado
      const { data, error } = await supabase
        .rpc('is_email_verified', { user_uuid: user.id });
      
      if (error) {
        console.error('Error checking email verification:', error);
        return false;
      }
      
      return data || false;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  }

  // Google Authentication
  async signInWithGoogle(): Promise<{ user: User; profile: Profile | null }> {
    try {
      // Crear la URI de redirección correcta para Expo
      const redirectUri = makeRedirectUri({
        scheme: 'futplus',
        path: 'auth-callback'
      });
      
      console.log('Redirect URI:', redirectUri);
      
      // Obtener la URL de autenticación de Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true, // Importante: no redirigir automáticamente
        }
      });

      if (error) throw error;
      if (!data.url) throw new Error('No se pudo obtener la URL de autenticación');

      console.log('OAuth URL:', data.url);

      // Abrir el navegador para autenticación
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUri
      );

      console.log('WebBrowser result:', result);

      if (result.type === 'success' && result.url) {
        // Extraer los parámetros de la URL de callback
        const url = new URL(result.url);
        const access_token = url.searchParams.get('access_token');
        const refresh_token = url.searchParams.get('refresh_token');

        // Si no hay tokens en los parámetros, buscar en el hash
        let accessToken = access_token;
        let refreshToken = refresh_token;
        
        if (!accessToken && url.hash) {
          const hashParams = new URLSearchParams(url.hash.substring(1));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        if (accessToken && refreshToken) {
          // Establecer la sesión con los tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) throw sessionError;
          
          // Obtener el usuario actual
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('No se pudo obtener el usuario');

          // Obtener o crear el perfil
          let profile = await this.getProfile(user.id);
          
          if (!profile) {
            // Crear perfil con datos de Google
            // Obtener valores por defecto de la configuración
            const configService = ConfigService.getInstance();
            const userDefaults = configService.getUserDefaults();
            
            profile = await this.createProfile(user.id, {
              name: user.user_metadata.full_name ||
                    user.user_metadata.name ||
                    user.email?.split('@')[0] ||
                    'Usuario',
              avatar_url: user.user_metadata.avatar_url ||
                         user.user_metadata.picture,
              position: userDefaults.position,
              age: userDefaults.age,
              level: userDefaults.level,
              objective: userDefaults.objective,
            });
          }

          return {
            user: {
              id: user.id,
              email: user.email!,
              created_at: user.created_at,
            },
            profile
          };
        } else {
          throw new Error('No se pudieron obtener los tokens de autenticación');
        }
      } else if (result.type === 'cancel') {
        throw new Error('Autenticación cancelada por el usuario');
      } else {
        throw new Error('Error durante la autenticación');
      }
    } catch (error) {
      console.error('Error en Google Sign In:', error);
      throw this.handleError(error);
    }
  }

  // Profile Management
  async createProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...profileData,
          user_id: userId,
          created_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró perfil
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Session Management
  async getCurrentUser(): Promise<{ user: User; profile: Profile | null } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const profile = await this.getProfile(user.id);

      return {
        user: {
          id: user.id,
          email: user.email!,
          created_at: user.created_at,
        },
        profile,
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async refreshSession(): Promise<void> {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helpers
  private handleError(error: any): AuthError {
    console.error('Auth error:', error);
    
    // Detectar errores de rate limit (HTTP 429)
    if (error.status === 429 || error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
      return { message: 'Demasiadas solicitudes. Por favor, espera un momento antes de intentar de nuevo.', code: 'RATE_LIMIT_ERROR' };
    }
    
    if (error.message) {
      // Manejar errores de rate limit con tiempo específico
      if (error.message.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(error.message.split(':')[1]);
        return {
          message: `Por favor espera ${seconds} segundos antes de solicitar otro código.`,
          code: 'RATE_LIMIT_ERROR',
        };
      }
      
      // Traducir mensajes comunes de Supabase
      const errorMap: { [key: string]: string } = {
        'Invalid login credentials': 'Credenciales inválidas',
        'User already registered': 'Este email ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Invalid email': 'Email inválido',
        'new row violates row-level security policy for table "profiles"': 'Error de permisos al crear el perfil. Por favor, contacta soporte.',
        'Email rate limit exceeded': 'Has solicitado demasiados códigos. Por favor, espera unos minutos.',
        'duplicate key value violates unique constraint': 'Este usuario ya existe',
        'Token has expired or is invalid': 'El código ha expirado o es inválido',
        'Token is invalid or has expired': 'El código es inválido o ha expirado',
        'Invalid token': 'Código inválido',
        'Token expired': 'El código ha expirado',
        'OTP expired': 'El código de verificación ha expirado',
        'Invalid OTP': 'Código de verificación inválido',
        'For security purposes, you can only request this after': 'Por motivos de seguridad, debes esperar antes de solicitar otro código.',
      };

      // Buscar coincidencia parcial si no hay coincidencia exacta
      let translatedMessage = errorMap[error.message];
      if (!translatedMessage) {
        for (const [key, value] of Object.entries(errorMap)) {
          if (error.message.includes(key)) {
            translatedMessage = value;
            break;
          }
        }
      }

      return {
        message: translatedMessage || error.message,
        code: error.code || 'AUTH_ERROR',
      };
    }

    return {
      message: 'Ha ocurrido un error. Por favor intenta de nuevo.',
      code: 'UNKNOWN_ERROR',
    };
  }

  // Verificar si debe mantener la sesión
  async shouldRememberSession(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  }
}

export default new AuthService();