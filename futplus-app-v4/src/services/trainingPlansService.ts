import { supabase } from '../config/supabase';
import { videosService, VideoWithCategory } from './videosService';
import progressService from './progressService';
import trainingAnalyticsService from './trainingAnalyticsService';
import {
  TrainingPlan,
  TrainingPlanItem,
  PlanWithItems,
  TodayPlanSummary,
  SurveyInput,
  GeneratePlanResult,
} from '../types/trainingPlan.types';

type SubscriptionType = 'free' | 'premium';

function getTodayDateUTC(): string {
  // YYYY-MM-DD en UTC
  return new Date().toISOString().slice(0, 10);
}

function estimateMinutesForItem(videoDurationSec: number, setsTotal: number, restSeconds: number): number {
  const totalSec = videoDurationSec * setsTotal + restSeconds * Math.max(0, setsTotal - 1);
  return Math.ceil(totalSec / 60);
}

function isStrengthCategory(slug?: string | null, fallback?: string | null): boolean {
  const n = (slug || fallback || '').toLowerCase().trim();
  return ['physical', 'fuerza', 'strength', 'fuerza-fisica', 'físico', 'fisico'].includes(n);
}

class TrainingPlansService {
  // Obtiene el plan del día (UTC) con items y join de video + categoría
  async getTodayPlan(userId: string): Promise<PlanWithItems | null> {
    const planDate = getTodayDateUTC();

    const { data: plan, error: planErr } = await supabase
      .from('daily_training_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', planDate)
      .maybeSingle();

    if (planErr) {
      console.warn('getTodayPlan: error fetching plan', planErr);
      return null;
    }
    if (!plan) return null;

    const { data: items, error: itemsErr } = await supabase
      .from('daily_training_plan_items')
      .select(`
        *,
        video:videos (
          *,
          video_categories (*)
        )
      `)
      .eq('plan_id', plan.id)
      .order('order_index', { ascending: true });

    if (itemsErr) {
      console.warn('getTodayPlan: error fetching items', itemsErr);
      return { plan: plan as TrainingPlan, items: [] };
    }

    const mapped: TrainingPlanItem[] = (items || []).map((it: any) => ({
      ...it,
      video: it.video as VideoWithCategory,
    }));

    return { plan: plan as TrainingPlan, items: mapped };
  }

  // Crea o devuelve el plan del día (sin items)
  async getOrCreateTodayPlan(userId: string, title: string = 'Plan diario'): Promise<TrainingPlan> {
    const planDate = getTodayDateUTC();

    // Intentar recuperar
    const { data: existing, error: selErr } = await supabase
      .from('daily_training_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', planDate)
      .maybeSingle();

    if (!selErr && existing) {
      return existing as TrainingPlan;
    }

    // Crear
    const { data, error } = await supabase
      .from('daily_training_plans')
      .insert({
        user_id: userId,
        plan_date: planDate,
        title,
        total_estimated_minutes: 0,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) {
      console.error('getOrCreateTodayPlan: insert error', error);
      throw error;
    }
    return data as TrainingPlan;
  }

  // Genera el plan del día según encuesta. Si el plan existente tiene progreso, no sobrescribe.
  async generatePlanFromSurvey(userId: string, survey: SurveyInput): Promise<GeneratePlanResult> {
    const plan = await this.getOrCreateTodayPlan(userId);

    // Verificar progreso existente en items
    const { count, error: countErr } = await supabase
      .from('daily_training_plan_items')
      .select('*', { count: 'exact', head: true })
      .eq('plan_id', plan.id)
      .gt('sets_completed', 0);
 
    if (countErr) {
      console.warn('generatePlanFromSurvey: count items error', countErr);
    }
 
    // Modo append: si ya existe progreso pero el plan tiene menos ítems que los deseados,
    // añadimos los faltantes en lugar de abortar.
    let appendMode = false;
    let existingItems: { id: string; video_id: string; order_index: number }[] = [];
    if ((count || 0) > 0) {
      const { data: existing, error: existingErr } = await supabase
        .from('daily_training_plan_items')
        .select('id, video_id, order_index')
        .eq('plan_id', plan.id)
        .order('order_index', { ascending: true });
      if (existingErr) {
        console.warn('generatePlanFromSurvey: fetch existing items error', existingErr);
      }
      const targetCount = Math.max(1, Math.min(survey.exercisesCount || 1, 10));
      const existingCount = Array.isArray(existing) ? existing.length : 0;
      if (existingCount >= targetCount) {
        return { ok: false, reason: 'PLAN_HAS_PROGRESS', message: 'El plan actual ya tiene progreso, no se regenera.' };
      }
      appendMode = true;
      existingItems = (existing as any) || [];
    }
 
    // Limpiar items existentes (solo si NO hay progreso)
    if (!appendMode) {
      const { error: delErr } = await supabase
        .from('daily_training_plan_items')
        .delete()
        .eq('plan_id', plan.id);
 
      if (delErr) {
        console.warn('generatePlanFromSurvey: delete items error', delErr);
      }
    }

    const subscriptionType: SubscriptionType = survey.subscriptionType;
    const allVideos = await videosService.getVideosForUser(subscriptionType);
 
    // Filtro por premium (excluir si free), salvo en autogeneración silenciosa
    const allowPremium = !!survey.includePremiumDuringAutoGen;
    const categoriesSet = new Set((survey.categories || []).map(c => c.toLowerCase().trim()));
    const filtered = allVideos.filter(v => {
      if (!allowPremium && subscriptionType === 'free' && v.is_premium) return false;
 
      if (categoriesSet.size === 0) return true; // sin filtro, aceptar
      const slug = v.video_categories?.slug?.toLowerCase().trim() || v.category?.toLowerCase().trim();
      return slug ? categoriesSet.has(slug) : false;
    });

    if (filtered.length === 0) {
      return { ok: false, reason: 'NO_CANDIDATE_VIDEOS', message: 'No hay videos candidatos para los filtros.' };
    }

    // Orden simple por duración ascendente
    const ordered = [...filtered].sort((a, b) => (a.duration || 0) - (b.duration || 0));
 
    // Seleccionar elementos para alcanzar el objetivo:
    // - Si appendMode: completar hasta targetCount evitando, en lo posible, duplicar video_id
    // - Si no: seleccionar exactamente targetCount
    const targetCount = Math.max(1, Math.min(survey.exercisesCount || 1, 10));
    if (ordered.length === 0) {
      return { ok: false, reason: 'NO_CANDIDATE_VIDEOS', message: 'No hay videos candidatos para los filtros.' };
    }
 
    const existingCount = appendMode ? existingItems.length : 0;
    const needed = appendMode ? Math.max(0, targetCount - existingCount) : targetCount;
 
    const excludeIds = new Set<string>(appendMode ? existingItems.map((e: any) => String(e.video_id)) : []);
    let pool = ordered.filter((v) => !excludeIds.has(String((v as any).id)));
    if (pool.length < needed) {
      // Permitir wrap-around si no hay suficientes candidatos únicos
      pool = [...pool, ...ordered];
    }
    const selected: VideoWithCategory[] = pool.slice(0, needed);

    // Construir items con series por defecto (4 para físico/fuerza, 3 resto)
    // Para usuarios free: los videos premium se insertan como "completed"
    // para que cuenten en el progreso y permitan completar el entrenamiento.
    const restDefault = 30;
    const startIndex = appendMode
      ? (existingItems.length > 0 ? (existingItems[existingItems.length - 1].order_index || (existingItems.length - 1)) + 1 : 0)
      : 0;
    const itemsToInsert = selected.map((v, idx) => {
      const catSlug = v.video_categories?.slug || v.category || null;
      const isStrength = isStrengthCategory(catSlug, v.category);
      const setsTotal = isStrength ? 4 : 3;
      const estimated = estimateMinutesForItem(v.duration || 0, setsTotal, restDefault);
      const isPremium = !!(v as any)?.is_premium;
      const autoCompleted = subscriptionType === 'free' && isPremium;
 
      return {
        plan_id: plan.id,
        video_id: v.id,
        order_index: startIndex + idx,
        category_slug: catSlug,
        sets_total: setsTotal,
        sets_completed: autoCompleted ? setsTotal : 0,
        rest_seconds: restDefault,
        estimated_minutes: estimated,
        status: autoCompleted ? 'completed' : 'pending',
        completed_at: autoCompleted ? new Date().toISOString() : (null as string | null),
      };
    });

    // Insertar items
    const { data: items, error: insErr } = await supabase
      .from('daily_training_plan_items')
      .insert(itemsToInsert)
      .select('*')
      .order('order_index', { ascending: true });

    if (insErr) {
      console.error('generatePlanFromSurvey: insert items error', insErr);
      return { ok: false, reason: 'UNKNOWN', message: 'Error insertando items' };
    }

    // Calcular/actualizar total estimado del plan
    let updPlan: any = null;
    if (!appendMode) {
      const totalEstimated = (items || []).reduce((acc, it) => acc + (it.estimated_minutes || 0), 0);
      const { data: upd, error: updErr } = await supabase
        .from('daily_training_plans')
        .update({
          total_estimated_minutes: totalEstimated,
          status: 'active',
        })
        .eq('id', plan.id)
        .select('*')
        .single();
      if (updErr) {
        console.warn('generatePlanFromSurvey: update plan error', updErr);
      }
      updPlan = upd;
    } else {
      // Recalcular total considerando items previos + nuevos
      await this.recomputePlanTotalEstimatedMinutes(plan.id);
      const { data: planRow } = await supabase
        .from('daily_training_plans')
        .select('*')
        .eq('id', plan.id)
        .single();
      updPlan = planRow || plan;
    }

    // Retornar con join de video para UX inmediata
    const { data: itemsWithVideo, error: itemsErr } = await supabase
      .from('daily_training_plan_items')
      .select(`
        *,
        video:videos (
          *,
          video_categories (*)
        )
      `)
      .eq('plan_id', plan.id)
      .order('order_index', { ascending: true });

    const mapped: TrainingPlanItem[] = (itemsWithVideo || []).map((it: any) => ({
      ...it,
      video: it.video as VideoWithCategory,
    }));
 
    // Analítica: plan generado (incluye modo append)
    try {
      await trainingAnalyticsService.recordPlanGenerated(userId, plan.id);
    } catch (e) {
      console.warn('analytics: recordPlanGenerated warn', e);
    }
 
    return { ok: true, plan: (updPlan || plan) as TrainingPlan, items: mapped };
  }

  // Permite ajustar las series de un item. Recalcula estimated_minutes y normaliza sets_completed.
  async updateItemSetsTotal(userId: string, itemId: string, newSetsTotal: number): Promise<TrainingPlanItem | null> {
    const { data: current, error: curErr } = await supabase
      .from('daily_training_plan_items')
      .select('*, plan:daily_training_plans!inner(user_id), video:videos(*)')
      .eq('id', itemId)
      .single();

    if (curErr || !current) {
      console.warn('updateItemSetsTotal: fetch item error', curErr);
      return null;
    }

    if (current.plan?.user_id !== userId) {
      console.warn('updateItemSetsTotal: forbidden');
      return null;
    }

    const video = current.video as VideoWithCategory | undefined;
    const clampedSets = Math.max(1, Math.min(newSetsTotal || 1, 10));
    const clampedCompleted = Math.min(current.sets_completed || 0, clampedSets);
    const restSeconds = current.rest_seconds || 30;
    const videoDurSec = video?.duration || 0;
    const estimated = estimateMinutesForItem(videoDurSec, clampedSets, restSeconds);

    const { data: updated, error: updErr } = await supabase
      .from('daily_training_plan_items')
      .update({
        sets_total: clampedSets,
        sets_completed: clampedCompleted,
        estimated_minutes: estimated,
        status: clampedCompleted > 0 ? (clampedCompleted >= clampedSets ? 'completed' : 'in_progress') : 'pending',
        completed_at: clampedCompleted >= clampedSets ? new Date().toISOString() : null,
      })
      .eq('id', itemId)
      .select(`
        *,
        video:videos(*, video_categories(*))
      `)
      .single();

    if (updErr) {
      console.error('updateItemSetsTotal: update error', updErr);
      return null;
    }

    // Recalcular total del plan (opcional para consistencia)
    await this.recomputePlanTotalEstimatedMinutes(current.plan_id);

    return {
      ...(updated as any),
      video: (updated as any)?.video as VideoWithCategory,
    } as TrainingPlanItem;
  }

  // Marca avance de series: incrementa o fija sets_completed y aplica estado; side effects en user_video_progress
  async markSetCompleted(
    userId: string,
    itemId: string,
    nextValue?: number
  ): Promise<TrainingPlanItem | null> {
    // Traer item + video y plan ownership
    const { data: itemRow, error: itemErr } = await supabase
      .from('daily_training_plan_items')
      .select('*, plan:daily_training_plans!inner(user_id), video:videos(*)')
      .eq('id', itemId)
      .single();

    if (itemErr || !itemRow) {
      console.warn('markSetCompleted: fetch error', itemErr);
      return null;
    }
    if (itemRow.plan?.user_id !== userId) {
      console.warn('markSetCompleted: forbidden');
      return null;
    }

    const video: VideoWithCategory | undefined = itemRow.video as any;
    const setsTotal = itemRow.sets_total || 1;
    const current = itemRow.sets_completed || 0;

    let newValue: number;
    if (typeof nextValue === 'number' && !Number.isNaN(nextValue)) {
      newValue = Math.max(0, Math.min(nextValue, setsTotal));
    } else {
      newValue = Math.max(0, Math.min(current + 1, setsTotal));
    }

    const nowCompleted = newValue >= setsTotal;
    const newStatus = newValue === 0 ? 'pending' : nowCompleted ? 'completed' : 'in_progress';

    // Actualizar item
    const { data: updated, error: updErr } = await supabase
      .from('daily_training_plan_items')
      .update({
        sets_completed: newValue,
        status: newStatus,
        completed_at: nowCompleted ? new Date().toISOString() : null,
      })
      .eq('id', itemId)
      .select(`
        *,
        video:videos(*, video_categories(*))
      `)
      .single();

    if (updErr) {
      console.error('markSetCompleted: update item error', updErr);
      return null;
    }

    // Side effect: progreso del video
    if (video) {
      const watchedSeconds = Math.floor((video.duration || 0) * newValue);
      try {
        await videosService.updateVideoProgress(userId, video.id, watchedSeconds, nowCompleted);
      } catch (e) {
        console.warn('markSetCompleted: updateVideoProgress warn', e);
      }
    }
 
    // Intentar finalizar plan si corresponde
    try {
      await this.finalizePlanIfCompleted(userId, itemRow.plan_id);
    } catch (e) {
      console.warn('markSetCompleted: finalize warn', e);
    }
 
    // Analítica: set completado y, si corresponde, ejercicio completado
    try {
      await trainingAnalyticsService.recordSetCompleted(
        userId,
        itemId,
        itemRow.plan_id,
        video?.id,
        newValue
      );
      if (nowCompleted) {
        await trainingAnalyticsService.recordItemCompleted(userId, itemId, itemRow.plan_id, video?.id || null);
      }
    } catch (e) {
      console.warn('analytics: recordSet/ItemCompleted warn', e);
    }
 
    return {
      ...(updated as any),
      video: (updated as any)?.video as VideoWithCategory,
    } as TrainingPlanItem;
  }

  // Completa el item (todas las series)
  async markItemCompleted(userId: string, itemId: string): Promise<TrainingPlanItem | null> {
    // Traer item + video y plan ownership
    const { data: itemRow, error: itemErr } = await supabase
      .from('daily_training_plan_items')
      .select('*, plan:daily_training_plans!inner(user_id), video:videos(*)')
      .eq('id', itemId)
      .single();

    if (itemErr || !itemRow) {
      console.warn('markItemCompleted: fetch error', itemErr);
      return null;
    }
    if (itemRow.plan?.user_id !== userId) {
      console.warn('markItemCompleted: forbidden');
      return null;
    }

    const video: VideoWithCategory | undefined = itemRow.video as any;
    const setsTotal = itemRow.sets_total || 1;

    const { data: updated, error: updErr } = await supabase
      .from('daily_training_plan_items')
      .update({
        sets_completed: setsTotal,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select(`
        *,
        video:videos(*, video_categories(*))
      `)
      .single();

    if (updErr) {
      console.error('markItemCompleted: update error', updErr);
      return null;
    }

    // Side effect: progreso del video como completed
    if (video) {
      const watchedSeconds = Math.floor((video.duration || 0) * setsTotal);
      try {
        await videosService.updateVideoProgress(userId, video.id, watchedSeconds, true);
      } catch (e) {
        console.warn('markItemCompleted: updateVideoProgress warn', e);
      }
    }
 
    // Intentar finalizar plan si corresponde
    try {
      await this.finalizePlanIfCompleted(userId, itemRow.plan_id);
    } catch (e) {
      console.warn('markItemCompleted: finalize warn', e);
    }
 
    // Analítica: ejercicio completado
    try {
      await trainingAnalyticsService.recordItemCompleted(userId, itemId, itemRow.plan_id, video?.id || null);
    } catch (e) {
      console.warn('analytics: recordItemCompleted warn', e);
    }
 
    return {
      ...(updated as any),
      video: (updated as any)?.video as VideoWithCategory,
    } as TrainingPlanItem;
  }

  // Si todos los items del plan están completos, marca el plan como completed y actualiza user_progress (minutes_active y training_days)
  async finalizePlanIfCompleted(userId: string, planId: string): Promise<void> {
    // Contar items y completados
    const { data: allItems, error: itemsErr } = await supabase
      .from('daily_training_plan_items')
      .select('id, status, estimated_minutes')
      .eq('plan_id', planId);

    if (itemsErr || !Array.isArray(allItems) || allItems.length === 0) {
      return;
    }

    const total = allItems.length;
    const completed = allItems.filter(i => i.status === 'completed').length;
    if (total === 0 || completed < total) return;

    // Marcar plan como completed (si no lo está)
    const { data: planRow, error: planErr } = await supabase
      .from('daily_training_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planErr || !planRow) return;
    if (planRow.status !== 'completed') {
      await supabase
        .from('daily_training_plans')
        .update({ status: 'completed' })
        .eq('id', planId);
    }

    // Actualizar progreso del usuario: sumar minutos activos y training_days + 1
    try {
      const current = await progressService.getUserProgress(userId);
      const minutesToAdd = (allItems || []).reduce((acc, it: any) => acc + (it.estimated_minutes || 0), 0);
 
      await progressService.updateProgress(userId, {
        minutes_active: (current?.minutes_active || 0) + minutesToAdd,
        training_days: (current?.training_days || 0) + 1,
      } as any);
    } catch (e) {
      console.warn('finalizePlanIfCompleted: update progress warn', e);
    }
 
    // Analítica: plan completado
    try {
      await trainingAnalyticsService.recordPlanCompleted(userId, planId);
    } catch (e) {
      console.warn('analytics: recordPlanCompleted warn', e);
    }
  }

  async recomputePlanTotalEstimatedMinutes(planId: string): Promise<void> {
    const { data: items, error: itemsErr } = await supabase
      .from('daily_training_plan_items')
      .select('estimated_minutes')
      .eq('plan_id', planId);

    if (itemsErr || !Array.isArray(items)) return;

    const total = items.reduce((acc, it) => acc + (it.estimated_minutes || 0), 0);

    await supabase
      .from('daily_training_plans')
      .update({ total_estimated_minutes: total })
      .eq('id', planId);
  }

  // Resumen del plan de hoy para Dashboard
  async getTodaySummary(userId: string): Promise<TodayPlanSummary> {
    const planDate = getTodayDateUTC();

    const { data: plan, error: planErr } = await supabase
      .from('daily_training_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_date', planDate)
      .maybeSingle();

    if (planErr || !plan) {
      return {
        plan_id: null,
        status: null,
        total_items: 0,
        items_completed: 0,
        total_estimated_minutes: 0,
        minutes_completed: 0,
      };
    }

    const { data: items, error: itemsErr } = await supabase
      .from('daily_training_plan_items')
      .select('status, estimated_minutes, sets_total, sets_completed')
      .eq('plan_id', plan.id);

    if (itemsErr || !Array.isArray(items)) {
      return {
        plan_id: plan.id,
        status: plan.status,
        total_items: 0,
        items_completed: 0,
        total_estimated_minutes: plan.total_estimated_minutes || 0,
        minutes_completed: 0,
      };
    }

    const totalItems = items.length;
    const itemsCompleted = items.filter(i => i.status === 'completed').length;
    const totalEstimated = plan.total_estimated_minutes || 0;

    // Aproximación de minutos completados: prorrateo por series completadas vs totales
    const minutesCompleted = items.reduce((acc, it: any) => {
      const setsT = Math.max(1, it.sets_total || 1);
      const setsC = Math.max(0, Math.min(it.sets_completed || 0, setsT));
      const ratio = setsT > 0 ? setsC / setsT : 0;
      return acc + Math.round((it.estimated_minutes || 0) * ratio);
    }, 0);

    return {
      plan_id: plan.id,
      status: plan.status,
      total_items: totalItems,
      items_completed: itemsCompleted,
      total_estimated_minutes: totalEstimated,
      minutes_completed: minutesCompleted,
    };
  }
}

export const trainingPlansService = new TrainingPlansService();
export default trainingPlansService;