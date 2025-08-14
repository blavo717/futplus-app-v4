import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';
import GlassCard from '../components/auth/GlassCard';
import GlassButton from '../components/onboarding/GlassButton';
import GradientBackground from '../components/common/GradientBackground';
import { useUserData } from '../hooks/useUserData';
import { useConfig } from '../hooks/useConfig';
import { useDayZero, useDayZeroContent } from '../hooks/useDayZero';

const { width } = Dimensions.get('window');

function PerfilScreen() {
  const { signOut, user, profile } = useAuth();
  const { progress, achievements, isLoading } = useUserData();
  const { colors, getConfigValue } = useConfig();
  const { isDayZero } = useDayZero();
  const { getWelcomeMessage } = useDayZeroContent();

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    
    // Header Styles
    headerContainer: {
      marginBottom: 30,
    },
    headerGradient: {
      paddingTop: 60,
      paddingBottom: 40,
      marginHorizontal: 20,
      borderRadius: 32,
      overflow: 'hidden',
    },
    profileHeader: {
      alignItems: 'center',
    },
    avatarContainer: {
      marginBottom: 20,
    },
    avatarRing: {
      padding: 4,
      borderRadius: 60,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
    },
    userName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    userEmail: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 16,
    },
    planBadge: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    planGradient: {
      paddingHorizontal: 20,
      paddingVertical: 8,
    },
    planText: {
      fontSize: 14,
      color: colors.text.primary,
      fontWeight: '600',
    },

    // Stats Section
    statsSection: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    statCard: {
      flex: 1,
      marginHorizontal: 5,
      paddingVertical: 24,
      alignItems: 'center',
    },
    statContent: {
      alignItems: 'center',
    },
    statTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginTop: 12,
      textAlign: 'center',
    },
    statSubtitle: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 4,
      textAlign: 'center',
    },

    // Circular Progress
    circularProgress: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressBackgroundCircle: {
      position: 'absolute',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    progressIndicator: {
      position: 'absolute',
      borderColor: colors.accent,
      borderTopColor: colors.accent,
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: 'transparent',
    },
    progressTextContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    progressLabel: {
      fontSize: 10,
      color: colors.text.secondary,
    },

    // Achievements Section
    achievementsSection: {
      marginBottom: 30,
    },
    achievementsScroll: {
      paddingHorizontal: 20,
    },
    achievementCard: {
      width: 120,
      height: 120,
      marginRight: 15,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    achievementLocked: {
      opacity: 0.5,
    },
    achievementContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    achievementIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    achievementIconLocked: {
      opacity: 0.5,
    },
    achievementTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.primary,
      textAlign: 'center',
    },
    achievementTextLocked: {
      color: colors.text.muted,
    },
    achievementOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 24,
    },
    lockIcon: {
      fontSize: 20,
    },
    viewAllButton: {
      marginHorizontal: 20,
      marginTop: 15,
      alignItems: 'center',
    },
    viewAllText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '600',
    },

    // Settings Section
    settingsSection: {
      marginBottom: 30,
    },
    settingsCard: {
      marginBottom: 20,
      paddingHorizontal: 0,
      paddingVertical: 0,
      overflow: 'hidden',
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    settingsIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 15,
    },
    settingsIcon: {
      fontSize: 20,
    },
    settingsContent: {
      flex: 1,
    },
    settingsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    settingsSubtitle: {
      fontSize: 13,
      color: colors.text.secondary,
      marginTop: 2,
    },
    settingsArrow: {
      fontSize: 24,
      color: colors.text.muted,
    },
    settingsSeparator: {
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      marginHorizontal: 20,
    },

    // Logout Section
    logoutSection: {
      marginHorizontal: 20,
      marginBottom: 40,
    },
    logoutButton: {
      marginBottom: 20,
    },
    versionText: {
      textAlign: 'center',
      fontSize: 12,
      color: colors.text.muted,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      color: colors.text.primary,
    },
    emptyState: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.text.muted,
      textAlign: 'center',
    },
  }), [colors]);
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const CircularProgress = ({ value, maxValue, size, strokeWidth, color }: any) => {
    const progress = (value / maxValue) * 100;
    
    return (
      <View style={[styles.circularProgress, { width: size, height: size }]}>
        <View style={[styles.progressBackgroundCircle, {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'rgba(255, 255, 255, 0.2)',
        }]} />
        <View style={[styles.progressIndicator, {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: color,
          borderRightColor: progress > 50 ? color : 'transparent',
          borderBottomColor: progress > 75 ? color : 'transparent',
          borderLeftColor: 'transparent',
          transform: [{ rotate: '-90deg' }],
        }]} />
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressValue}>{value}</Text>
          <Text style={styles.progressLabel}>de {maxValue}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const userName = profile?.name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const totalAchievements = achievements.length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <GradientBackground />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Modern Profile Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={[colors.primary, '#7C3AED', colors.accent]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarRing}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userEmail}>{userEmail}</Text>
              <View style={styles.planBadge}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']}
                  style={styles.planGradient}
                >
                  <Text style={styles.planText}>{getConfigValue('user.defaults.plan', 'Plan Gratuito')}</Text>
                </LinearGradient>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Visual Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Tu Progreso</Text>
          <View style={styles.statsContainer}>
            <GlassCard style={styles.statCard}>
              <View style={styles.statContent}>
                <CircularProgress
                  value={progress?.training_days || 0}
                  maxValue={getConfigValue('progress.targets.training_days', 4)}
                  size={80}
                  strokeWidth={4}
                  color={colors.accent}
                />
                <Text style={styles.statTitle}>Días de Entreno</Text>
                <Text style={styles.statSubtitle}>
                  {progress?.training_days === 0 ? '¡Comienza hoy!' : '¡Vas muy bien!'}
                </Text>
              </View>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <View style={styles.statContent}>
                <CircularProgress
                  value={progress?.nutrition_streak || 0}
                  maxValue={getConfigValue('progress.targets.nutrition_days', 7)}
                  size={80}
                  strokeWidth={4}
                  color={colors.accent}
                />
                <Text style={styles.statTitle}>Racha Nutrición</Text>
                <Text style={styles.statSubtitle}>
                  {progress?.nutrition_streak === 0 ? '¡Empieza tu racha!' : '¡Sigue así!'}
                </Text>
              </View>
            </GlassCard>
          </View>
        </View>

        {/* Achievement Showcase */}
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Logros Destacados</Text>
          {unlockedAchievements.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.achievementsScroll}
              >
                {unlockedAchievements.slice(0, 3).map((achievement) => (
                  <GlassCard key={achievement.id} style={styles.achievementCard}>
                    <View style={styles.achievementContent}>
                      <Text style={styles.achievementIcon}>
                        {achievement.achievement.icon}
                      </Text>
                      <Text style={styles.achievementTitle}>
                        {achievement.achievement.title}
                      </Text>
                    </View>
                  </GlassCard>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Ver todos los logros ({unlockedAchievements.length}/{totalAchievements})</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aún no tienes logros desbloqueados</Text>
              <Text style={styles.emptyStateSubtext}>¡Comienza tu primer entrenamiento para ganar tu primer logro!</Text>
            </View>
          )}
        </View>

        {/* Modern Settings Menu */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <GlassCard style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Text style={styles.settingsIcon}>👤</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Editar perfil</Text>
                <Text style={styles.settingsSubtitle}>Actualiza tu información</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsSeparator} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Text style={styles.settingsIcon}>⚽</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Posición y objetivos</Text>
                <Text style={styles.settingsSubtitle}>Tu posición y metas</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsSeparator} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Text style={styles.settingsIcon}>🔔</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Notificaciones</Text>
                <Text style={styles.settingsSubtitle}>Gestiona tus alertas</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsSeparator} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Text style={styles.settingsIcon}>💎</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Actualizar a Premium</Text>
                <Text style={styles.settingsSubtitle}>Desbloquea todas las funciones</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>
          </GlassCard>

          <GlassCard style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Text style={styles.settingsIcon}>💬</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Soporte</Text>
                <Text style={styles.settingsSubtitle}>¿Necesitas ayuda?</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsSeparator} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Text style={styles.settingsIcon}>📄</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Términos y condiciones</Text>
                <Text style={styles.settingsSubtitle}>Lee nuestras políticas</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsSeparator} />

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsIconContainer}>
                <Text style={styles.settingsIcon}>🔒</Text>
              </View>
              <View style={styles.settingsContent}>
                <Text style={styles.settingsTitle}>Privacidad</Text>
                <Text style={styles.settingsSubtitle}>Tu privacidad es importante</Text>
              </View>
              <Text style={styles.settingsArrow}>›</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Modern Logout Button */}
        <View style={styles.logoutSection}>
          <GlassButton
            title="Cerrar sesión"
            onPress={handleLogout}
            variant="glass"
            style={styles.logoutButton}
          />
          <Text style={styles.versionText}>FutPlus v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


export default PerfilScreen;
