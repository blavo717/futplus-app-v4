import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import BottomSheet from '../common/BottomSheet';
import DailyPlannerCard from './DailyPlannerCard';
import PlanItemCard from './PlanItemCard';
import useTodayPlan from '../../hooks/useTodayPlan';
import { upsertDailyPlanProposal } from '../../services/trainingTrackingService';

/** Helper para formatear fecha como YYYY-MM-DD (UTC) */
function toYMD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type PlannerMode = 'plan' | 'edit';

interface PlannerBottomSheetProps {
  visible: boolean;
  mode: PlannerMode;
  onClose: () => void;
}

/**
 * Bottom Sheet específico para el Planner
 * - mode='plan': encuesta para generar/regenerar plan
 * - mode='edit': lista compacta de ítems del plan con ajustes rápidos
 * - Incluye tabs locales para alternar Planificar/Editar sin cerrar
 */
const PlannerBottomSheet: React.FC<PlannerBottomSheetProps> = ({ visible, mode, onClose }) => {
  const [localMode, setLocalMode] = useState<PlannerMode>(mode);

  // Sincronizar modo inicial al abrir/cambiar props
  useEffect(() => {
    if (visible) setLocalMode(mode);
  }, [visible, mode]);

  const {
    plan,
    items,
    summary,
    isWorking,
    error,
    generate,
    markSetCompleted,
    markItemCompleted,
    updateItemSetsTotal,
    refresh,
  } = useTodayPlan();

  const hasPlan = (summary?.total_items || 0) > 0 || items.length > 0;

  const handleGenerate = async (payload: any) => {
    await generate(payload);
    // Refrescar y cerrar si todo fue bien (heurística simple)
    await refresh();

    // Registrar propuesta de plan (fuente: encuesta de usuario)
    try {
      const planDate = (plan?.plan_date as string | undefined) ?? toYMD(new Date());
      const planId = (summary?.plan_id as string | null | undefined) ?? (plan?.id as string | undefined) ?? null;
      await upsertDailyPlanProposal({ planDate, source: 'user_survey', planId });
    } catch (e) {
      // Silencioso: no bloquear UX
    }

    // Cerrar si ahora hay plan y no hay error activo
    if (!error && (items.length > 0 || (summary?.plan_id ?? null))) {
      onClose();
    }
  };

  const renderTabs = () => (
    <View style={styles.tabsRow}>
      <TouchableOpacity
        style={[styles.tabBtn, localMode === 'plan' && styles.tabBtnActive]}
        onPress={() => setLocalMode('plan')}
      >
        <Text style={[styles.tabText, localMode === 'plan' && styles.tabTextActive]}>Planificar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabBtn, localMode === 'edit' && styles.tabBtnActive]}
        onPress={() => setLocalMode('edit')}
      >
        <Text style={[styles.tabText, localMode === 'edit' && styles.tabTextActive]}>Editar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlanContent = () => (
    <View style={styles.innerContent}>
      {renderTabs()}
      <DailyPlannerCard
        subscriptionType="free"
        summary={summary}
        isWorking={isWorking}
        onGenerate={handleGenerate}
      />
    </View>
  );

  const renderEditContent = () => (
    <View style={styles.innerContent}>
      {renderTabs()}

      {!hasPlan ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No tienes un plan para hoy. Usa la pestaña “Planificar” para generarlo.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {items.map((it) => (
            <PlanItemCard
              key={it.id}
              item={it}
              onPlay={() => {}}
              onMarkSetCompleted={(id, next) => markSetCompleted(id, next)}
              onMarkItemCompleted={(id) => markItemCompleted(id)}
              onUpdateSetsTotal={(id, val) => updateItemSetsTotal(id, val)}
            />
          ))}
          <View style={{ height: 12 }} />
        </ScrollView>
      )}
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} heightPct={0.78}>
      {localMode === 'plan' ? renderPlanContent() : renderEditContent()}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  innerContent: {
    paddingBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderColor: 'rgba(99,102,241,0.6)',
  },
  tabText: {
    color: Colors.text.secondary,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 4,
  },
  emptyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyText: {
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});

export default PlannerBottomSheet;