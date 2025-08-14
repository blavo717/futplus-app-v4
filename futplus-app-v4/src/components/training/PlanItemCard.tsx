import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { TrainingPlanItem } from '../../types/trainingPlan.types';
import { VideoWithCategory } from '../../services/videosService';
import { logExerciseEvent } from '../../services/trainingTrackingService';

type ValidIconName = 'play' | 'checkmark-circle' | 'add' | 'remove' | 'time' | 'trending-up' | 'help-outline';
const VALID_IONICONS: ValidIconName[] = [
  'play',
  'checkmark-circle',
  'add',
  'remove',
  'time',
  'trending-up',
  'help-outline',
];

const getValidIcon = (name?: string): ValidIconName =>
  (name && VALID_IONICONS.includes(name as ValidIconName) ? (name as ValidIconName) : 'help-outline');

interface Props {
  item: TrainingPlanItem;
  onPlay: (video: VideoWithCategory) => void;
  onMarkSetCompleted: (itemId: string, nextValue?: number) => void;
  onMarkItemCompleted: (itemId: string) => void;
  onUpdateSetsTotal: (itemId: string, newSetsTotal: number) => void;
  compact?: boolean; // modo compacto para overlays/sheets

  /** Acción secundaria opcional para previsualizar video sin interrumpir flujo principal */
  onPreviewVideo?: (videoId: string) => void;
  /** Oculta o deshabilita el badge de previsualización (por defecto false) */
  disableVideoPreview?: boolean;
}

const PlanItemCard: React.FC<Props> = ({
  item,
  onPlay,
  onMarkSetCompleted,
  onMarkItemCompleted,
  onUpdateSetsTotal,
  compact = false,
  onPreviewVideo,
  disableVideoPreview = false,
}) => {
  const v = item.video as VideoWithCategory | undefined;

  const isCompleted = item.status === 'completed';
  const sets = Math.max(1, item.sets_total || 1);
  const completed = Math.max(0, Math.min(item.sets_completed || 0, sets));

  const categoryName = v?.video_categories?.name || v?.category || 'General';
  const level = v?.level || 'beginner';

  const levelText = useMemo(() => {
    switch (level) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return 'Todos';
    }
  }, [level]);

  // Resolución síncrona del videoId para preview.
  // Prioridad: item.video?.id -> item.video_id -> item.exercise?.videoId
  // TODO(videosService): Extraer a un helper y permitir mapeo asíncrono con services/videosService.ts
  const previewVideoId = useMemo(() => {
    const fromVideo = (v as any)?.id;
    const fromItem = item?.video_id;
    const fromExercise = (item as any)?.exercise?.videoId;
    return (fromVideo || fromItem || fromExercise || null) as string | null;
  }, [v?.id, item?.video_id, (item as any)?.exercise?.videoId]);

  const isPreviewDisabled = disableVideoPreview || !onPreviewVideo || !previewVideoId;

  const handlePlay = () => {
    if (v) onPlay(v);
  };

  const handleToggleSet = (index: number) => {
    // Si el usuario toca una casilla concreta, avanzamos al valor index+1
    const desired = index + 1;
    const prevSets = completed; // conservar valor previo
    const totalSets = sets;
    const planId = item.plan_id;
    const itemId = item.id;
    const videoId = item.video_id;

    // Ejecutar actualización de negocio (no bloquear por tracking)
    onMarkSetCompleted(item.id, desired);

    // Best-effort tracking (silencioso)
    (async () => {
      try {
        // started cuando se completa el primer set
        if (prevSets === 0 && desired > 0) {
          await logExerciseEvent({
            type: 'started',
            planId,
            itemId,
            videoId,
            sessionId: undefined,
            setIndex: 0,
            setsCompleted: desired,
            metadata: { ui: 'PlanItemCard' },
          });
        }
        // completed cuando alcanza sets_total
        if (desired === totalSets && desired > prevSets) {
          await logExerciseEvent({
            type: 'completed',
            planId,
            itemId,
            videoId,
            sessionId: undefined,
            setsCompleted: desired,
            metadata: { source: 'complete-set' },
          });
        }
      } catch {
        // silencioso
      }
    })();
  };

  const handleAdjustSets = (delta: 1 | -1) => {
    const next = Math.max(1, Math.min(10, sets + delta));
    if (next !== sets) {
      onUpdateSetsTotal(item.id, next);
    }
  };

  const perSetMinutes = useMemo(() => {
    const seconds = Math.max(1, v?.duration || 0);
    return Math.ceil(seconds / 60);
  }, [v?.duration]);

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']} style={[styles.card, compact && styles.cardCompact]}>
        {/* Mini badge Play para modo compacto */}
        {compact && (
          <TouchableOpacity
            style={[styles.miniPlayBadge, isPreviewDisabled && styles.miniPlayBadgeDisabled]}
            onPress={() => {
              if (!isPreviewDisabled && previewVideoId) {
                onPreviewVideo?.(previewVideoId);
              }
            }}
            disabled={isPreviewDisabled}
            accessibilityLabel={isPreviewDisabled ? 'Video no disponible' : 'Previsualizar video'}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            testID={isPreviewDisabled ? 'playBadgeDisabled' : 'playBadge'}
          >
            <Ionicons name={getValidIcon('play')} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        <View style={styles.header}>
          <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
            {v?.title || 'Ejercicio'}
          </Text>

          {!compact && (
            <TouchableOpacity style={[styles.playBtn, isCompleted && styles.playBtnCompleted]} onPress={handlePlay}>
              <Ionicons name={getValidIcon('play')} size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.metaRow, compact && styles.metaRowCompact]}>
          <View style={styles.metaItem}>
            <Ionicons name={getValidIcon('time')} size={14} color={Colors.text.secondary} />
            <Text style={styles.metaText}>
              {item.estimated_minutes} min estimados
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name={getValidIcon('trending-up')} size={14} color={Colors.text.secondary} />
            <Text style={styles.metaText}>{levelText}</Text>
          </View>

          {!!v?.is_premium && (
            <View style={styles.metaItem}>
              <Text style={[styles.metaText, { color: '#F59E0B' }]}>Premium</Text>
            </View>
          )}
        </View>

        <View style={[styles.seriesRow, compact && styles.seriesRowCompact]}>
          <Text style={[styles.seriesLabel, compact && styles.seriesLabelCompact]}>Series</Text>

          <View style={styles.seriesControls}>
            <TouchableOpacity style={styles.seriesAdjustBtn} onPress={() => handleAdjustSets(-1)} accessibilityLabel="Reducir series">
              <Ionicons name={getValidIcon('remove')} size={16} color="#fff" />
            </TouchableOpacity>

            <View style={styles.seriesDots}>
              {Array.from({ length: sets }).map((_, i) => {
                const done = i < completed;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.dot, done ? styles.dotDone : styles.dotPending]}
                    onPress={() => handleToggleSet(i)}
                    accessibilityLabel={`Serie ${i + 1} ${done ? 'completada' : 'pendiente'}`}
                  />
                );
              })}
            </View>

            <TouchableOpacity style={styles.seriesAdjustBtn} onPress={() => handleAdjustSets(1)} accessibilityLabel="Aumentar series">
              <Ionicons name={getValidIcon('add')} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.footer, compact && styles.footerCompact]}>
          {!compact && (
            <Text style={styles.footerText}>
              {categoryName} • {perSetMinutes} min por serie
            </Text>
          )}

          <TouchableOpacity
            style={[styles.completeBtn, isCompleted && styles.completeBtnDone, compact && styles.completeBtnCompact]}
            onPress={() => {
              // Ejecutar negocio primero
              onMarkItemCompleted(item.id);
              // Tracking best-effort de "completed"
              (async () => {
                try {
                  await logExerciseEvent({
                    type: 'completed',
                    planId: item.plan_id,
                    itemId: item.id,
                    videoId: item.video_id,
                    sessionId: undefined,
                    setsCompleted: Math.max(1, item.sets_total || 1),
                    metadata: { source: 'complete-item' },
                  });
                } catch {
                  // silencioso
                }
              })();
            }}
          >
            <Ionicons name={getValidIcon('checkmark-circle')} size={16} color="#fff" />
            <Text style={[styles.completeText, compact && styles.completeTextCompact]}>{isCompleted ? 'Completado' : 'Completar'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  wrapperCompact: {
    marginHorizontal: 12,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
  },
  cardCompact: {
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 14,
  },
  playBtn: {
    backgroundColor: 'rgba(99,102,241,0.5)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.8)',
  },
  playBtnCompleted: {
    backgroundColor: 'rgba(34,197,94,0.5)',
    borderColor: 'rgba(34,197,94,0.8)',
  },
  miniPlayBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  miniPlayBadgeDisabled: {
    opacity: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaRowCompact: {
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  seriesRow: {
    marginTop: 12,
  },
  seriesRowCompact: {
    marginTop: 8,
  },
  seriesLabel: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginBottom: 6,
  },
  seriesLabelCompact: {
    fontSize: 11,
    marginBottom: 4,
  },
  seriesControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  seriesAdjustBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
  },
  seriesDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  dotDone: {
    backgroundColor: '#22c55e',
    borderColor: 'rgba(34,197,94,0.9)',
  },
  dotPending: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  footer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerCompact: {
    marginTop: 8,
  },
  footerText: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderColor: 'rgba(99,102,241,0.6)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  completeBtnCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completeBtnDone: {
    backgroundColor: 'rgba(34,197,94,0.25)',
    borderColor: 'rgba(34,197,94,0.6)',
  },
  completeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  completeTextCompact: {
    fontSize: 11,
  },
});

export default PlanItemCard;