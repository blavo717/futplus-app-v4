import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../auth/GlassCard';
import { Colors } from '../../constants/colors';
import { categoriesService } from '../../services/categoriesService';
import { Category } from '../../types/category.types';
import { SurveyInput, TodayPlanSummary } from '../../types/trainingPlan.types';
import { useNextResetCountdown } from '../../hooks/useNextResetCountdown';

type SubscriptionType = 'free' | 'premium';

interface DailyPlannerCardProps {
  subscriptionType: SubscriptionType;
  summary?: TodayPlanSummary;
  isWorking?: boolean;
  onGenerate: (survey: SurveyInput) => Promise<void> | void;
}

const TIME_PRESETS = [10, 20, 30, 45, 60] as const;

const DailyPlannerCard: React.FC<DailyPlannerCardProps> = ({
  subscriptionType,
  summary,
  isWorking = false,
  onGenerate,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [exercisesCount, setExercisesCount] = useState<number>(3);
  const [timeMinutes, setTimeMinutes] = useState<number>(30);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCats(true);
        const cats = await categoriesService.getCategories();
        setCategories(cats);
      } catch (e) {
        setError('No se pudieron cargar categorías');
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, []);

  const toggleCat = (slug: string) => {
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const incrementExercises = (delta: 1 | -1) => {
    setExercisesCount((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleGenerate = async () => {
    const payload: SurveyInput = {
      exercisesCount,
      categories: selectedCats,
      timeMinutes,
      subscriptionType,
    };
    await onGenerate(payload);
  };

  const planProgressLabel = useMemo(() => {
    if (!summary || !summary.total_items) return null;
    return `Hoy ${summary.items_completed}/${summary.total_items} ejercicios • ${summary.minutes_completed}/${summary.total_estimated_minutes} min`;
  }, [summary]);

  // TODO(dayZero): Integrar offset horario real desde useDayZero cuando exponga startHour/offsetHours.
  const dayZeroOffsetHours = 0;
  const { formatted } = useNextResetCountdown(dayZeroOffsetHours);

  // Completed-today: usamos el summary del plan de HOY (mismo criterio temporal que el hook de plan)
  const isAllCompletedToday = useMemo(() => {
    if (!summary) return false;
    if (!summary.total_items) return false;
    return summary.items_completed >= summary.total_items;
  }, [summary]);

  return (
    <View style={styles.wrapper}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.title}>Planificador de entrenamiento diario</Text>
            <Text
              style={styles.countdownText}
              numberOfLines={1}
              ellipsizeMode="tail"
              testID="nextTrainingCountdown"
            >
              Próximo entrenamiento en {formatted || '—'}
            </Text>
          </View>
          {!!planProgressLabel && (
            <Text style={styles.progressMini}>{planProgressLabel}</Text>
          )}
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>¿Cuántos ejercicios hoy?</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={[styles.stepperBtn, styles.stepperBtnLeft]}
              onPress={() => incrementExercises(-1)}
              accessibilityLabel="Disminuir ejercicios"
            >
              <Text style={styles.stepperText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperValueText}>{exercisesCount}</Text>
            </View>
            <TouchableOpacity
              style={[styles.stepperBtn, styles.stepperBtnRight]}
              onPress={() => incrementExercises(1)}
              accessibilityLabel="Aumentar ejercicios"
            >
              <Text style={styles.stepperText}>＋</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>¿Qué categorías te gustaría entrenar?</Text>
          {loadingCats ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.chipsWrap}>
              {categories.map((c) => {
                const active = selectedCats.includes(c.slug);
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleCat(c.slug)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {c.icon || '🏷️'} {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>¿Cuánto tiempo tienes disponible?</Text>
          <View style={styles.chipsWrap}>
            {TIME_PRESETS.map((t) => {
              const active = timeMinutes === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setTimeMinutes(t)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t} min</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerate}
          disabled={isWorking}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.generateGradient}
          >
            {isWorking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.generateText}>
                {summary?.plan_id ? 'Regenerar plan' : 'Generar plan'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {isAllCompletedToday && (
          <Text style={styles.completedText} testID="todayCompletedMessage">
            Entrenamiento de hoy completado
          </Text>
        )}

        {!!summary?.total_estimated_minutes && (
          <Text style={styles.estimatedText}>
            Tiempo estimado total: {summary.total_estimated_minutes} min
          </Text>
        )}
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  progressMini: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  countdownText: {
    fontSize: 12,
    color: Colors.text.secondary,
    flexShrink: 1,
    textAlign: 'right',
  },
  row: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stepperBtnLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  stepperBtnRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  stepperText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  stepperValue: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  stepperValueText: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  block: {
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderColor: 'rgba(99,102,241,0.6)',
  },
  chipText: {
    color: Colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Colors.text.primary,
  },
  center: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  error: {
    color: '#ff8a8a',
    fontSize: 12,
  },
  generateBtn: {
    marginTop: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  generateGradient: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  generateText: {
    color: '#fff',
    fontWeight: '700',
  },
  completedText: {
    marginTop: 8,
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  estimatedText: {
    marginTop: 10,
    color: Colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default DailyPlannerCard;