import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/auth/GlassCard';
import GlassButton from '../components/onboarding/GlassButton';
import GradientBackground from '../components/common/GradientBackground';
import { Colors } from '../constants/colors';
import useTodayPlan from '../hooks/useTodayPlan';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUserData } from '../hooks/useUserData';
import { useConfig } from '../hooks/useConfig';
import { useDayZero, useDayZeroContent } from '../hooks/useDayZero';

const { width } = Dimensions.get('window');

// Circular Progress Component
const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color,
  label = '',
  subtitle = '',
  colors
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  subtitle?: string;
  colors?: any;
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [percentage]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [0.8, 1],
  });

  return (
    <View style={styles.circularProgressContainer}>
      <Animated.View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            transform: [{ scale }],
          }
        ]}
      >
        <View style={[styles.progressContent, { width: size, height: size }]}>
          <Animated.Text style={[styles.progressPercentage, { opacity: animatedValue, color: colors?.text.primary || '#FFFFFF' }]}>
            {percentage}%
          </Animated.Text>
          {label && <Text style={[styles.progressLabel, { color: colors?.text.secondary || '#E5E5E5' }]}>{label}</Text>}
          {subtitle && <Text style={[styles.progressSubtitle, { color: colors?.text.muted || '#A0A0A0' }]}>{subtitle}</Text>}
        </View>
      </Animated.View>
    </View>
  );
};

// Achievement Badge Component
const AchievementBadge = ({
  icon,
  title,
  description,
  unlocked = true,
  colors
}: {
  icon: string;
  title: string;
  description: string;
  unlocked?: boolean;
  colors?: any;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.achievementContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={unlocked ? ['rgba(0, 255, 136, 0.2)', 'rgba(91, 33, 182, 0.2)'] : ['rgba(128, 128, 128, 0.1)', 'rgba(128, 128, 128, 0.1)']}
          style={[styles.achievementBadge, !unlocked && styles.achievementLocked]}
        >
          <View style={[styles.achievementIcon, !unlocked && styles.achievementIconLocked]}>
            <Text style={[styles.achievementIconText, !unlocked && styles.achievementIconTextLocked]}>
              {icon}
            </Text>
          </View>
          <Text style={[styles.achievementTitle, !unlocked && styles.achievementTextLocked, { color: colors?.text.primary || '#FFFFFF' }]}>{title}</Text>
          <Text style={[styles.achievementDescription, !unlocked && styles.achievementTextLocked, { color: colors?.text.secondary || '#E5E5E5' }]}>{description}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Stats Card Component
const StatsCard = ({
  title,
  value,
  change,
  icon,
  colors
}: {
  title: string;
  value: string;
  change: string;
  icon: string;
  colors?: any;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        style={styles.statsGradient}
      >
        <View style={styles.statsHeader}>
          <Text style={[styles.statsTitle, { color: colors?.text.secondary || '#E5E5E5' }]}>{title}</Text>
          <Text style={styles.statsIcon}>{icon}</Text>
        </View>
        <Text style={[styles.statsValue, { color: colors?.text.primary || '#FFFFFF' }]}>{value}</Text>
        <Text style={[styles.statsChange, change.startsWith('+') ? styles.statsPositive : styles.statsNegative]}>
          {change}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

// Timeline Item Component
const TimelineItem = ({
  time,
  title,
  description,
  type = 'training',
  colors
}: {
  time: string;
  title: string;
  description: string;
  type?: 'training' | 'nutrition' | 'recovery';
  colors?: any;
}) => {
  const typeColors = {
    training: colors?.accent || '#00FF88',
    nutrition: '#FF6B6B',
    recovery: '#4ECDC4'
  };

  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineDot, { backgroundColor: typeColors[type] }]} />
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineTime, { color: colors?.accent || '#00FF88' }]}>{time}</Text>
        <Text style={[styles.timelineTitle, { color: colors?.text.primary || '#FFFFFF' }]}>{title}</Text>
        <Text style={[styles.timelineDescription, { color: colors?.text.secondary || '#E5E5E5' }]}>{description}</Text>
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const { user, profile, weeklyProgress, progress, achievements, activities, upcomingActivities, isLoading } = useUserData();
  const { colors, getConfigValue } = useConfig();
  const { isDayZero, hasCompletedOnboarding, hasStartedTraining } = useDayZero();
  const { getWelcomeMessage, getCallToAction, getEmptyStateMessage } = useDayZeroContent();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const navigation = useNavigation<any>();
  const { summary: todaySummary } = useTodayPlan();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const userName = profile?.name || user?.email?.split('@')[0] || 'Futbolista';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <GradientBackground />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.primary }]}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <Text style={[styles.greeting, { color: colors.text.primary }]}>¡Hola, {userName}! ⚽</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Hoy es un gran día para mejorar</Text>
          <Text style={[styles.date, { color: colors.text.muted }]}>{today}</Text>
        </Animated.View>

        {/* Progress Overview */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Tu progreso esta semana</Text>
          <View style={styles.progressRow}>
            <CircularProgress
              percentage={weeklyProgress.training}
              label="Entrenamiento"
              subtitle={`${progress?.training_days || 0}/${getConfigValue('progress.targets.training_days', 4)} días`}
              color={colors.accent}
              colors={colors}
            />
            <CircularProgress
              percentage={weeklyProgress.nutrition}
              label="Nutrición"
              subtitle={`${progress?.nutrition_streak || 0}/${getConfigValue('progress.targets.nutrition_days', 7)} días`}
              color="#FF6B6B"
              colors={colors}
            />
            <CircularProgress
              percentage={weeklyProgress.rest}
              label="Descanso"
              subtitle={`${progress?.rest_hours || 0}/${getConfigValue('progress.targets.rest_hours', 10)} horas`}
              color="#4ECDC4"
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Estadísticas rápidas</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="Calorías"
              value={(progress?.calories_burned || getConfigValue('progress.defaults.calories_burned', 0)).toLocaleString()}
              change="+0%"
              icon="🔥"
              colors={colors}
            />
            <StatsCard
              title="Minutos activo"
              value={(progress?.minutes_active || getConfigValue('progress.defaults.minutes_active', 0)).toString()}
              change="+0%"
              icon="⏱️"
              colors={colors}
            />
            <StatsCard
              title="Racha actual"
              value={`${progress?.current_streak || getConfigValue('progress.defaults.current_streak', 0)} días`}
              change="+0 días"
              icon="🔥"
              colors={colors}
            />
            <StatsCard
              title="Nivel"
              value={(progress?.level || getConfigValue('progress.defaults.level', 1)).toString()}
              change="+0"
              icon="⭐"
              colors={colors}
            />
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Logros recientes</Text>
          {achievements.filter(a => a.unlocked).length > 0 ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.achievementsScroll}
            >
              {achievements.filter(a => a.unlocked).slice(0, 4).map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  icon={achievement.achievement.icon}
                  title={achievement.achievement.title}
                  description={achievement.achievement.description}
                  unlocked={achievement.unlocked}
                  colors={colors}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors?.text.secondary || '#E5E5E5' }]}>{getEmptyStateMessage('achievements').subtitle}</Text>
            </View>
          )}
        </Animated.View>

        {/* Plan de hoy */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Plan de hoy</Text>
          <GlassCard style={styles.timelineCard}>
            {todaySummary?.total_items > 0 ? (
              <View style={{ gap: 8 }}>
                <Text style={[styles.trainingDescription, { color: colors.text.secondary }]}>
                  Hoy {todaySummary.items_completed}/{todaySummary.total_items} ejercicios • {todaySummary.minutes_completed}/{todaySummary.total_estimated_minutes} min
                </Text>
                <TouchableOpacity style={styles.startButton}>
                  <LinearGradient
                    colors={[colors.accent, colors.gradient.purple[1]]}
                    style={styles.startButtonGradient}
                  >
                    <Text
                      onPress={() => navigation.navigate('Entrenamiento' as never)}
                      style={[styles.startButtonText, { color: colors.text.primary }]}
                    >
                      Ir a entrenar
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors?.text.secondary || '#E5E5E5' }]}>
                  Aún no has creado tu plan de hoy
                </Text>
                <TouchableOpacity style={styles.startButton}>
                  <LinearGradient
                    colors={[colors.accent, colors.gradient.purple[1]]}
                    style={styles.startButtonGradient}
                  >
                    <Text
                      onPress={() => navigation.navigate('Entrenamiento' as never)}
                      style={[styles.startButtonText, { color: colors.text.primary }]}
                    >
                      Crear plan
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Timeline */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Próximas actividades</Text>
          {upcomingActivities.length > 0 ? (
            <GlassCard style={styles.timelineCard}>
              {upcomingActivities.map((activity, index) => (
                <TimelineItem
                  key={activity.id}
                  time={new Date(activity.scheduled_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  title={activity.title}
                  description={activity.description}
                  type={activity.type}
                  colors={colors}
                />
              ))}
            </GlassCard>
          ) : (
            <GlassCard style={styles.timelineCard}>
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: colors?.text.secondary || '#E5E5E5' }]}>{getEmptyStateMessage('activities').title}</Text>
                <Text style={[styles.emptyStateSubtext, { color: colors?.text.muted || '#A0A0A0' }]}>{getEmptyStateMessage('activities').subtitle}</Text>
              </View>
            </GlassCard>
          )}
        </Animated.View>

        {/* Welcome Message for New Users */}
        {isDayZero && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.welcomeCard} variant="dark">
              <Text style={[styles.welcomeTitle, { color: colors.text.primary }]}>{getWelcomeMessage().title}</Text>
              <Text style={[styles.welcomeDescription, { color: colors.text.secondary }]}>
                {getWelcomeMessage().description}
              </Text>
              <TouchableOpacity style={styles.startButton}>
                <LinearGradient
                  colors={[colors.accent, colors.gradient.purple[1]]}
                  style={styles.startButtonGradient}
                >
                  <Text style={[styles.startButtonText, { color: colors.text.primary }]}>{getCallToAction().text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  circularProgressContainer: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  progressSubtitle: {
    fontSize: 10,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  statsCard: {
    width: (width - 52) / 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
  },
  statsIcon: {
    fontSize: 20,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsPositive: {
    color: '#00FF88',
  },
  statsNegative: {
    color: '#FF6B6B',
  },
  achievementsScroll: {
    paddingHorizontal: 20,
  },
  achievementContainer: {
    marginRight: 16,
    width: 140,
  },
  achievementBadge: {
    width: 140,
    height: 140,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementIconLocked: {
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
  },
  achievementIconText: {
    fontSize: 24,
  },
  achievementIconTextLocked: {
    opacity: 0.5,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  achievementTextLocked: {
    opacity: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionCard: {
    width: (width - 52) / 2,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timelineCard: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
    paddingLeft: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
  },
  nextTraining: {
    marginBottom: 40,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  trainingTitle: {
    fontSize: 18,
    marginBottom: 8,
    lineHeight: 24,
  },
  trainingDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  trainingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trainingTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  trainingDifficulty: {
    fontSize: 14,
  },
  progressCircle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
  },
  progressArc: {
    position: 'absolute',
  },
  progressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF88',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  welcomeCard: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  startButton: {
    marginTop: 10,
  },
  startButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
