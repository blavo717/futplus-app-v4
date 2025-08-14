import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { TrainingPlanItem, TodayPlanSummary } from '../../types/trainingPlan.types';

interface Props {
  items: TrainingPlanItem[];
  summary?: TodayPlanSummary;
  loading?: boolean;
  isEnsuring?: boolean;
}

/**
 * Lista minimalista de los ejercicios del día (solo lectura).
 * - Muestra título, series totales y minutos estimados por ejercicio.
 * - Cuando loading/isEnsuring, muestra skeletons.
 */
const TodayPlanList: React.FC<Props> = ({ items, summary, loading, isEnsuring }) => {
  const isLoading = !!loading || !!isEnsuring;

  if (isLoading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Plan de hoy</Text>
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
        <View style={styles.skeletonRow} />
      </View>
    );
  }

  return (
    <View style={styles.card} testID="todayPlanList">
      <Text style={styles.title}>Plan de hoy</Text>

      {summary?.total_items ? (
        <Text style={styles.miniSummary}>
          Hoy {summary.items_completed}/{summary.total_items} ejercicios • {summary.minutes_completed}/{summary.total_estimated_minutes} min
        </Text>
      ) : (
        <Text style={styles.miniSummary}>Generando tu plan rápido…</Text>
      )}

      {items.length === 0 ? (
        <Text style={styles.emptyText}>Aún no hay ejercicios</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {items.map((it) => {
            const v = it.video as any;
            const title = v?.title || 'Ejercicio';
            const sets = Math.max(1, it.sets_total || 1);
            const mins = Math.max(0, it.estimated_minutes || 0);
            const status =
              it.status === 'completed'
                ? 'Completado'
                : it.status === 'in_progress'
                ? 'En curso'
                : 'Pendiente';

            return (
              <View key={it.id} style={styles.item} testID={`todayPlanItem-${it.id}`}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {sets} series • {mins} min
                  </Text>
                </View>
                <View style={[styles.badge, getStatusStyle(it.status)]}>
                  <Text style={styles.badgeText}>{status}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

function getStatusStyle(status?: string) {
  switch (status) {
    case 'completed':
      return { backgroundColor: 'rgba(34,197,94,0.18)', borderColor: 'rgba(34,197,94,0.6)' };
    case 'in_progress':
      return { backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.6)' };
    default:
      return { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' };
  }
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 6,
  },
  miniSummary: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  itemTitle: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemMeta: {
    color: Colors.text.secondary,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: 13,
  },
  skeletonRow: {
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 8,
  },
});

export default TodayPlanList;