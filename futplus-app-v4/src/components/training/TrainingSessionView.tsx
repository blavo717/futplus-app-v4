import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import useTodayPlan from '../../hooks/useTodayPlan';
import PlanItemCard from './PlanItemCard';
import useStopwatch from '../../hooks/useStopwatch';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { getAppDayStart, getNextAppDayStart } from '../../utils/appDay';
import { TrainingPlanItem } from '../../types/trainingPlan.types';
import { VideoWithCategory } from '../../services/videosService';
import VideoOverlayCard from '../video/VideoOverlayCard';

interface Props {
  onClose?: () => void;
}

/**
 * Vista reutilizable de sesión de entrenamiento (sin Modal).
 * - Se puede montar en pantalla dedicada o dentro de un overlay/BottomSheet.
 * - Incluye cronómetro, controles rápidos y lista compacta de ejercicios.
 * - Resuelve "extras" (progresos completados hoy fuera del plan) y los fusiona.
 */
const TrainingSessionView: React.FC<Props> = ({ onClose }) => {
  const {
    items,
    summary,
    markSetCompleted,
    markItemCompleted,
    updateItemSetsTotal,
    refresh,
  } = useTodayPlan();

  // Autenticación para consultar progreso de videos
  const { user } = useAuth();

  // Placeholder de tipo de suscripción hasta integrar lógica real
  const getUserSubscriptionType = (): 'free' | 'premium' => {
    return 'free';
  };
  const userSubscriptionType = getUserSubscriptionType();

  // TODO(dayZero): Integrar offset real (startHour/offsetHours) cuando esté disponible.
  const dayZeroOffsetHours = 0;

  // Momento de referencia para "hoy de app"
  const nowRef = useRef<Date>(new Date());

  // Progreso completado hoy de ejercicios extra (no planificados)
  const [completedExtras, setCompletedExtras] = useState<TrainingPlanItem[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState<boolean>(true);

  // Preview de video (overlay)
  const [videoPreview, setVideoPreview] = useState<{ visible: boolean; videoId?: string | null }>({
    visible: false,
    videoId: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadExtrasCompletedToday = async () => {
      try {
        if (!user?.id) {
          if (!cancelled) {
            setCompletedExtras([]);
            setIsLoadingProgress(false);
          }
          return;
        }

        setIsLoadingProgress(true);
        const now = nowRef.current;
        const start = getAppDayStart(now, dayZeroOffsetHours);
        const nextStart = getNextAppDayStart(now, dayZeroOffsetHours);

        const { data, error } = await supabase
          .from('user_video_progress')
          .select(`
            video_id,
            completed_at,
            completed,
            videos:videos (
              *,
              video_categories (*)
            )
          `)
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('completed_at', start.toISOString())
          .lt('completed_at', nextStart.toISOString());

        if (error) {
          console.warn('TrainingSessionView: error fetch user_video_progress', error);
          if (!cancelled) {
            setCompletedExtras([]);
            setIsLoadingProgress(false);
          }
          return;
        }

        const plannedVideoIds = new Set((items || []).map((it) => it.video_id));
        const rows = Array.isArray(data) ? data : [];

        // Extras = completados hoy que NO están en el plan de hoy
        const extras = rows
          .filter((r: any) => r?.video_id && !plannedVideoIds.has(r.video_id))
          .sort((a: any, b: any) => {
            const ta = new Date(a?.completed_at || 0).getTime();
            const tb = new Date(b?.completed_at || 0).getTime();
            return ta - tb;
          })
          .map((r: any, idx: number) => {
            const v: VideoWithCategory | undefined = r?.videos || undefined;
            const estimatedMinutes = Math.ceil(((v?.duration as number) || 0) / 60);

            const fakeItem: TrainingPlanItem = {
              id: `extra-${r.video_id}`,
              plan_id: 'extra',
              video_id: r.video_id,
              order_index: 100000 + idx,
              category_slug: (v?.video_categories as any)?.slug || (v as any)?.category || null,
              sets_total: 1,
              sets_completed: 1,
              rest_seconds: 0,
              estimated_minutes: estimatedMinutes,
              status: 'completed',
              completed_at: r?.completed_at || new Date().toISOString(),
              created_at: r?.completed_at || new Date().toISOString(),
              updated_at: r?.completed_at || new Date().toISOString(),
              video: v || null,
            };

            return fakeItem;
          });

        if (!cancelled) {
          setCompletedExtras(extras);
          setIsLoadingProgress(false);
        }
      } catch (e) {
        console.warn('TrainingSessionView: exception fetching extras', e);
        if (!cancelled) {
          setCompletedExtras([]);
          setIsLoadingProgress(false);
        }
      }
    };

    // Cargar al montar y cuando cambien items del plan
    loadExtrasCompletedToday();

    return () => {
      cancelled = true;
    };
  }, [user?.id, dayZeroOffsetHours, items]);

  // Lista fusionada: planificados hoy (orden original) ∪ extras completados hoy (no planificados)
  const mergedItems = useMemo(() => {
    const planned = items || [];
    const plannedVideoIds = new Set(planned.map((it) => it.video_id));
    const extras = (completedExtras || []).filter((ex) => !plannedVideoIds.has(ex.video_id));
    return [...planned, ...extras];
  }, [items, completedExtras]);

  // Resuelve el VideoWithCategory seleccionado a partir del videoId del preview, sin IO extra
  const selectedVideo: VideoWithCategory | null = useMemo(() => {
    if (!videoPreview.visible || !videoPreview.videoId) return null;
    const id = String(videoPreview.videoId);
    const match = mergedItems.find((it) => {
      const vid = (it as any)?.video?.id;
      const iid = it?.video_id;
      const exId = (it as any)?.exercise?.videoId;
      return (vid && String(vid) === id) || (iid && String(iid) === id) || (exId && String(exId) === id);
    });
    return (match?.video as VideoWithCategory) || null;
  }, [videoPreview.visible, videoPreview.videoId, mergedItems]);

  const activeIndex = useMemo(() => {
    if (!items || items.length === 0) return -1;
    const idx = items.findIndex((it) => it.status !== 'completed');
    return idx < 0 ? items.length - 1 : idx;
  }, [items]);

  const activeItem = activeIndex >= 0 ? items[activeIndex] : null;

  const {
    mmss,
    isRunning,
    toggle,
    reset,
  } = useStopwatch({ autoStart: false });

  const onCompleteSet = async () => {
    if (!activeItem) return;
    await markSetCompleted(activeItem.id);
    await refresh();
  };

  const onCompleteExercise = async () => {
    if (!activeItem) return;
    await markItemCompleted(activeItem.id);
    await refresh();
  };

  const onNext = async () => {
    await refresh();
  };

  return (
    <SafeAreaView style={styles.container} testID="trainingSessionView">
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Entrenamiento de hoy</Text>
          {!!onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Cerrar" testID="closeTrainingSession">
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Summary */}
        <Text style={styles.subTitle}>
          {summary?.total_items
            ? `Ejercicios ${summary.items_completed}/${summary.total_items} • ${summary.minutes_completed}/${summary.total_estimated_minutes} min`
            : 'Sin plan para hoy'}
        </Text>

        {/* Stopwatch */}
        <View style={styles.stopwatchBox}>
          <Text style={styles.timeText}>{mmss}</Text>
          <View style={styles.timeActions}>
            <TouchableOpacity onPress={toggle} style={[styles.timeBtn, isRunning ? styles.btnDanger : styles.btnPrimary]} testID="stopwatchToggle">
              <Text style={styles.timeBtnText}>{isRunning ? 'Pausa' : 'Play'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={[styles.timeBtn, styles.btnSecondary]} testID="stopwatchReset">
              <Text style={styles.timeBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Exercise quick controls */}
        {activeItem && (
          <View style={styles.activeBox}>
            <Text style={styles.activeTitle} numberOfLines={2}>
              {activeItem?.video?.title || 'Ejercicio'}
            </Text>
            <Text style={styles.activeMeta}>
              {activeItem.sets_completed}/{activeItem.sets_total} series • {activeItem.estimated_minutes} min estimados
            </Text>
            <View style={styles.activeActions}>
              <TouchableOpacity onPress={onCompleteSet} style={[styles.actionBtn, styles.actionPrimary]} testID="completeSet">
                <Text style={styles.actionText}>Completar serie</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onCompleteExercise} style={[styles.actionBtn, styles.actionSuccess]} testID="completeExercise">
                <Text style={styles.actionText}>Completar ejercicio</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onNext} style={[styles.actionBtn, styles.actionSecondary]} testID="nextExercise">
                <Text style={styles.actionText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* List of items - compact */}
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          {mergedItems.map((it) => {
            const isExtra = it.plan_id === 'extra' || String(it.id).startsWith('extra-');
            return (
              <View key={it.id}>
                {isExtra && (
                  <View style={styles.extraBadge} testID="extraCompletedBadge">
                    <Text style={styles.extraBadgeText}>Completado (extra)</Text>
                  </View>
                )}
                <PlanItemCard
                  item={it}
                  onPlay={() => {}}
                  onMarkSetCompleted={isExtra ? () => {} : (id, next) => markSetCompleted(id, next)}
                  onMarkItemCompleted={isExtra ? () => {} : (id) => markItemCompleted(id)}
                  onUpdateSetsTotal={isExtra ? () => {} : (id, val) => updateItemSetsTotal(id, val)}
                  compact
                  onPreviewVideo={(videoId) => {
                    // Gating premium al previsualizar en sesión
                    const id = String(videoId);
                    const match = mergedItems.find((itm) => {
                      const vid = (itm as any)?.video?.id;
                      const iid = itm?.video_id;
                      const exId = (itm as any)?.exercise?.videoId;
                      return (vid && String(vid) === id) || (iid && String(iid) === id) || (exId && String(exId) === id);
                    });
                    const v = (match as any)?.video;
                    if (v?.is_premium && userSubscriptionType === 'free') {
                      Alert.alert(
                        '🎯 Contenido Premium',
                        'Este video es premium. Actualiza tu suscripción para acceder a entrenamientos exclusivos.',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Ver Planes', onPress: () => console.log('Navegar a planes premium') },
                        ]
                      );
                      return;
                    }
                    setVideoPreview({ visible: true, videoId });
                  }}
                />
              </View>
            );
          })}
        </ScrollView>
      </View>

      {videoPreview.visible && selectedVideo && (
        <View testID="videoOverlay">
          <VideoOverlayCard
            video={selectedVideo}
            onClose={() => setVideoPreview({ visible: false, videoId: null })}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.background || '#111',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    maxHeight: '98%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: '800',
  },
  closeBtn: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.text.primary,
    fontSize: 26,
    lineHeight: 26,
  },
  subTitle: {
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 12,
    paddingBottom: 8,
  },
  stopwatchBox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  timeActions: {
    flexDirection: 'row',
    gap: 10,
  },
  timeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderColor: 'rgba(99,102,241,0.6)',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnDanger: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderColor: 'rgba(239,68,68,0.6)',
  },
  timeBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  activeBox: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 12,
  },
  activeTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  activeMeta: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginBottom: 10,
  },
  activeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderColor: 'rgba(99,102,241,0.6)',
  },
  actionSuccess: {
    backgroundColor: 'rgba(34,197,94,0.25)',
    borderColor: 'rgba(34,197,94,0.6)',
  },
  actionSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  list: {
    marginTop: 8,
  },
  extraBadge: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor: 'rgba(34,197,94,0.6)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  extraBadgeText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default TrainingSessionView;