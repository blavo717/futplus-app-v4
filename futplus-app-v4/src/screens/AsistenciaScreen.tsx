import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/auth/GlassCard';
import GlassButton from '../components/onboarding/GlassButton';
import GradientBackground from '../components/common/GradientBackground';
import { Colors } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AttendanceDay {
  date: number;
  status: 'present' | 'absent' | 'pending';
  isToday?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface Stats {
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  attendanceRate: number;
  weeklyAverage: number;
  monthlyGoal: number;
  currentMonth: number;
}

function AsistenciaScreen() {
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fadeAnim] = useState(new Animated.Value(0));

  // Mock data
  const attendanceData: AttendanceDay[] = [
    { date: 1, status: 'present' },
    { date: 2, status: 'present' },
    { date: 3, status: 'absent' },
    { date: 4, status: 'present' },
    { date: 5, status: 'present' },
    { date: 6, status: 'present' },
    { date: 7, status: 'present' },
    { date: 8, status: 'present' },
    { date: 9, status: 'present' },
    { date: 10, status: 'present' },
    { date: 11, status: 'absent' },
    { date: 12, status: 'present' },
    { date: 13, status: 'present' },
    { date: 14, status: 'present' },
    { date: 15, status: 'present', isToday: true },
    { date: 16, status: 'pending' },
    { date: 17, status: 'pending' },
    { date: 18, status: 'pending' },
    { date: 19, status: 'pending' },
    { date: 20, status: 'pending' },
    { date: 21, status: 'pending' },
    { date: 22, status: 'pending' },
    { date: 23, status: 'pending' },
    { date: 24, status: 'pending' },
    { date: 25, status: 'pending' },
    { date: 26, status: 'pending' },
    { date: 27, status: 'pending' },
    { date: 28, status: 'pending' },
    { date: 29, status: 'pending' },
    { date: 30, status: 'pending' },
  ];

  const achievements: Achievement[] = [
    { id: '1', title: 'Primer Día', emoji: '🎯', description: 'Asistencia registrada', unlocked: true },
    { id: '2', title: 'Racha Inicial', emoji: '🔥', description: '5 días consecutivos', unlocked: true },
    { id: '3', title: 'Semana Completa', emoji: '⭐', description: '7 días seguidos', unlocked: true },
    { id: '4', title: 'Asistencia Perfecta', emoji: '💯', description: '30 días sin faltar', unlocked: false, progress: 15, maxProgress: 30 },
    { id: '5', title: 'Constancia', emoji: '🏆', description: '100 días de asistencia', unlocked: false, progress: 15, maxProgress: 100 },
  ];

  const stats: Stats = {
    totalDays: 15,
    currentStreak: 4,
    longestStreak: 7,
    attendanceRate: 87,
    weeklyAverage: 5.5,
    monthlyGoal: 20,
    currentMonth: 15
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return Colors.accent;
      case 'absent': return '#FF6B6B';
      case 'pending': return 'rgba(255, 255, 255, 0.3)';
      default: return 'rgba(255, 255, 255, 0.3)';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return '✓';
      case 'absent': return '✗';
      case 'pending': return '○';
      default: return '○';
    }
  };

  const renderCalendar = () => {
    const daysInMonth = 30;
    const firstDayOfMonth = 1;
    const weeks = [];
    let currentWeek = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayData = attendanceData.find(d => d.date === i) || { date: i, status: 'pending' };
      currentWeek.push(dayData);

      if (currentWeek.length === 7 || i === daysInMonth) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    return (
      <GlassCard style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.calendarTitle}>Asistencia - Julio 2024</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, selectedView === 'week' && styles.toggleActive]}
              onPress={() => setSelectedView('week')}
            >
              <Text style={[styles.toggleText, selectedView === 'week' && styles.toggleTextActive]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, selectedView === 'month' && styles.toggleActive]}
              onPress={() => setSelectedView('month')}
            >
              <Text style={[styles.toggleText, selectedView === 'month' && styles.toggleTextActive]}>Mes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekDays}>
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
            <Text key={index} style={styles.weekDay}>{day}</Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {week.map((day, dayIndex) => (
              <TouchableOpacity
                key={`${weekIndex}-${dayIndex}`}
                style={[
                  styles.dayCircle,
                  { backgroundColor: getStatusColor(day.status) },
                  day.isToday && styles.todayCircle
                ]}
              >
                <Text style={[
                  styles.dayText,
                  day.status === 'present' && styles.presentText,
                  day.status === 'absent' && styles.absentText
                ]}>
                  {getStatusIcon(day.status)}
                </Text>
                {day.isToday && <View style={styles.todayIndicator} />}
              </TouchableOpacity>
            ))}
            {week.length < 7 && Array(7 - week.length).fill(null).map((_, index) => (
              <View key={`empty-${index}`} style={styles.emptyDay} />
            ))}
          </View>
        ))}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.accent }]} />
            <Text style={styles.legendText}>Presente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B6B' }]} />
            <Text style={styles.legendText}>Ausente</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
            <Text style={styles.legendText}>Pendiente</Text>
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderStats = () => (
    <GlassCard style={styles.statsCard}>
      <Text style={styles.sectionTitle}>Estadísticas</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.attendanceRate}%</Text>
          <Text style={styles.statLabel}>Asistencia</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Racha actual</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.longestStreak}</Text>
          <Text style={styles.statLabel}>Mejor racha</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.currentMonth}/{stats.monthlyGoal}</Text>
          <Text style={styles.statLabel}>Meta mensual</Text>
        </View>
      </View>
    </GlassCard>
  );

  const renderAchievements = () => (
    <View style={styles.achievementsSection}>
      <Text style={styles.sectionTitle}>Logros</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll}>
        {achievements.map((achievement) => (
          <GlassCard key={achievement.id} style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}>
            <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
            {achievement.progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={[Colors.accent, '#10B981']}
                    style={[styles.progressFill, { width: `${(achievement.progress / achievement.maxProgress!) * 100}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressText}>
                  {achievement.progress}/{achievement.maxProgress}
                </Text>
              </View>
            )}
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Asistencia</Text>
          <Text style={styles.subtitle}>Registra tu asistencia diaria y mantén tu racha</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {renderStats()}
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {renderCalendar()}
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {renderAchievements()}
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.actionSection}>
            <GlassButton
              title="Registrar Asistencia"
              onPress={() => {}}
              variant="primary"
              style={styles.actionButton}
            />
            <GlassButton
              title="Ver Historial"
              onPress={() => {}}
              variant="glass"
              style={styles.actionButton}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    opacity: 0.9,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  calendarCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  toggleActive: {
    backgroundColor: Colors.accent,
  },
  toggleText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDay: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
    width: 40,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  presentText: {
    color: Colors.primary,
  },
  absentText: {
    color: Colors.primary,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  emptyDay: {
    width: 40,
    height: 40,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementsScroll: {
    paddingHorizontal: 20,
  },
  achievementCard: {
    width: 140,
    height: 160,
    marginRight: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 11,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  progressBar: {
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: Colors.text.secondary,
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    marginHorizontal: 0,
  },
});

export default AsistenciaScreen;
