import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import trainingPlansService from '../services/trainingPlansService';
import { PlanWithItems, TodayPlanSummary, TrainingPlanItem, SurveyInput } from '../types/trainingPlan.types';

interface UseTodayPlanState {
  plan: PlanWithItems['plan'] | null;
  items: TrainingPlanItem[];
  summary: TodayPlanSummary;
  isLoading: boolean;
  isWorking: boolean; // operaciones puntuales (generar, marcar, actualizar)
  isEnsuring: boolean; // autogeneración silenciosa si no hay plan
  error: string | null;
}

const initialSummary: TodayPlanSummary = {
  plan_id: null,
  status: null,
  total_items: 0,
  items_completed: 0,
  total_estimated_minutes: 0,
  minutes_completed: 0,
};

export function useTodayPlan() {
  const { user } = useAuth();
  const [state, setState] = useState<UseTodayPlanState>({
    plan: null,
    items: [],
    summary: initialSummary,
    isLoading: true,
    isWorking: false,
    isEnsuring: false,
    error: null,
  });

  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setState((s) => ({ ...s, isLoading: false, error: null }));
      return;
    }
    try {
      setState((s) => ({ ...s, isLoading: true, error: null }));
      const [planWithItems, summary] = await Promise.all([
        trainingPlansService.getTodayPlan(userId),
        trainingPlansService.getTodaySummary(userId),
      ]);

      if (planWithItems) {
        setState({
          plan: planWithItems.plan,
          items: planWithItems.items,
          summary,
          isLoading: false,
          isWorking: false,
          isEnsuring: false,
          error: null,
        });
      } else {
        setState({
          plan: null,
          items: [],
          summary,
          isLoading: false,
          isWorking: false,
          isEnsuring: false,
          error: null,
        });
      }
    } catch (err) {
      console.error('useTodayPlan.load error', err);
      setState((s) => ({
        ...s,
        isLoading: false,
        error: 'No se pudo cargar el plan de hoy',
      }));
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = useCallback(
    async (survey: SurveyInput) => {
      if (!userId) return;
      try {
        setState((s) => ({ ...s, isWorking: true, error: null }));
        const res = await trainingPlansService.generatePlanFromSurvey(userId, survey);
        if (!res.ok) {
          setState((s) => ({
            ...s,
            isWorking: false,
            error:
              res.message ||
              (res.reason === 'PLAN_HAS_PROGRESS'
                ? 'El plan ya tiene progreso. Confirma antes de regenerar.'
                : 'No se pudo generar el plan.'),
          }));
          return;
        }

        // Refrescar summary y estado
        const summary = await trainingPlansService.getTodaySummary(userId);
        setState({
          plan: res.plan,
          items: res.items,
          summary,
          isLoading: false,
          isWorking: false,
          isEnsuring: false,
          error: null,
        });
      } catch (err) {
        console.error('useTodayPlan.generate error', err);
        setState((s) => ({
          ...s,
          isWorking: false,
          error: 'No se pudo generar el plan',
        }));
      }
    },
    [userId]
  );

  const markSetCompleted = useCallback(
    async (itemId: string, nextValue?: number) => {
      if (!userId) return;
      try {
        setState((s) => ({ ...s, isWorking: true, error: null }));
        const updated = await trainingPlansService.markSetCompleted(userId, itemId, nextValue);
        if (!updated) {
          setState((s) => ({ ...s, isWorking: false, error: 'No se pudo actualizar el ejercicio' }));
          return;
        }
        // Actualizar items en memoria
        setState((s) => {
          const items = s.items.map((it) => (it.id === itemId ? { ...updated } : it));
          return { ...s, items };
        });
        // Refrescar summary
        const summary = await trainingPlansService.getTodaySummary(userId);
        setState((s) => ({ ...s, summary, isWorking: false }));
      } catch (err) {
        console.error('useTodayPlan.markSetCompleted error', err);
        setState((s) => ({
          ...s,
          isWorking: false,
          error: 'No se pudo actualizar el ejercicio',
        }));
      }
    },
    [userId]
  );

  const markItemCompleted = useCallback(
    async (itemId: string) => {
      if (!userId) return;
      try {
        setState((s) => ({ ...s, isWorking: true, error: null }));
        const updated = await trainingPlansService.markItemCompleted(userId, itemId);
        if (!updated) {
          setState((s) => ({ ...s, isWorking: false, error: 'No se pudo completar el ejercicio' }));
          return;
        }
        setState((s) => {
          const items = s.items.map((it) => (it.id === itemId ? { ...updated } : it));
          return { ...s, items };
        });
        const summary = await trainingPlansService.getTodaySummary(userId);
        setState((s) => ({ ...s, summary, isWorking: false }));
      } catch (err) {
        console.error('useTodayPlan.markItemCompleted error', err);
        setState((s) => ({
          ...s,
          isWorking: false,
          error: 'No se pudo completar el ejercicio',
        }));
      }
    },
    [userId]
  );

  const updateItemSetsTotal = useCallback(
    async (itemId: string, newSetsTotal: number) => {
      if (!userId) return;
      try {
        setState((s) => ({ ...s, isWorking: true, error: null }));
        const updated = await trainingPlansService.updateItemSetsTotal(userId, itemId, newSetsTotal);
        if (!updated) {
          setState((s) => ({ ...s, isWorking: false, error: 'No se pudo actualizar las series' }));
          return;
        }
        setState((s) => {
          const items = s.items.map((it) => (it.id === itemId ? { ...updated } : it));
          return { ...s, items };
        });
        // Recalcular summary
        const summary = await trainingPlansService.getTodaySummary(userId);
        setState((s) => ({ ...s, summary, isWorking: false }));
      } catch (err) {
        console.error('useTodayPlan.updateItemSetsTotal error', err);
        setState((s) => ({
          ...s,
          isWorking: false,
          error: 'No se pudo actualizar las series',
        }));
      }
    },
    [userId]
  );

  // Defaults para autogeneración silenciosa
  const buildDefaultSurvey = useCallback((): SurveyInput => {
    return {
      exercisesCount: 4,
      categories: [],
      timeMinutes: 30,
      subscriptionType: 'free',
      includePremiumDuringAutoGen: true,
    };
  }, []);
 
  // Garantiza que exista un plan hoy: si no hay, genera con defaults y recarga
  const ensureTodayPlanIfEmpty = useCallback(async () => {
    if (!userId) return;
    try {
      setState((s) => ({ ...s, isEnsuring: true, error: null }));
 
      const currentSummary = await trainingPlansService.getTodaySummary(userId);
      const targetCount = buildDefaultSurvey().exercisesCount || 4;
      // Si ya hay el nº objetivo de items o más, solo sincronizamos summary y salimos
      if ((currentSummary?.total_items || 0) >= targetCount) {
        setState((s) => ({ ...s, summary: currentSummary, isEnsuring: false }));
        return;
      }
 
      // Generación sin fricción con defaults aprobados (insertará premium y los marcará completos si user free)
      const survey = buildDefaultSurvey();
      const res = await trainingPlansService.generatePlanFromSurvey(userId, survey);
      if (!res.ok) {
        // Si hay progreso previo, el servicio no regenera: salimos silenciosamente
        setState((s) => ({ ...s, isEnsuring: false }));
        return;
      }
 
      const newSummary = await trainingPlansService.getTodaySummary(userId);
      setState((s) => ({
        ...s,
        plan: res.plan,
        items: res.items,
        summary: newSummary,
        isEnsuring: false,
        isLoading: false,
        isWorking: false,
        error: null,
      }));
    } catch (e) {
      console.warn('useTodayPlan.ensureTodayPlanIfEmpty error', e);
      setState((s) => ({ ...s, isEnsuring: false }));
    }
  }, [userId, buildDefaultSurvey]);
 
  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  const completedCount = useMemo(
    () => state.items.filter((i) => i.status === 'completed').length,
    [state.items]
  );

  return {
    ...state,
    completedCount,
    // acciones
    generate,
    markSetCompleted,
    markItemCompleted,
    updateItemSetsTotal,
    refresh,
    ensureTodayPlanIfEmpty,
  };
}

export default useTodayPlan;