import { supabase } from '../config/supabase';
import trainingTrackingService from './trainingTrackingService';

export type TrainingEventType =
  | 'plan_generated'
  | 'session_start'
  | 'session_end'
  | 'item_set_completed'
  | 'item_completed'
  | 'plan_completed'
  | 'video_preview'
  | 'video_play'
  | 'premium_block';

export interface LogEventParams {
  userId: string | undefined | null;
  eventType: TrainingEventType;
  planId?: string | null;
  itemId?: string | null;
  videoId?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Servicio de analítica de entrenamiento: registra eventos en Supabase (RPC log_training_event)
 * y expone lecturas básicas de estadísticas.
 *
 * Tablas/Views (creadas por migración):
 * - public.training_events
 * - public.daily_user_training_stats
 * - public.user_exercise_stats
 * - public.v_user_weekday_failures
 * - public.v_user_adherence_last_30
 */
class TrainingAnalyticsService {
  private async logViaRPC(params: LogEventParams) {
    const { userId, eventType, planId, itemId, videoId, metadata } = params;
    if (!userId) return; // sin usuario autenticado no registramos

    const payload = {
      p_user_id: userId,
      p_event_type: eventType,
      p_plan_id: planId ?? null,
      p_item_id: itemId ?? null,
      p_video_id: videoId ?? null,
      p_metadata: metadata ?? {},
    };

    const { error } = await supabase.rpc('log_training_event', payload as any);
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('trainingAnalyticsService.logViaRPC: error', { payload, error });
    }
  }

  // Facades específicos

  async recordPlanGenerated(userId: string | undefined | null, planId: string) {
    await this.logViaRPC({ userId, eventType: 'plan_generated', planId });
  }

  /**
   * Wrapper: inicia sesión delegando al servicio de tracking.
   * Mantiene la firma previa; ignora userId (se obtiene desde sesión).
   * No retorna sessionId para mantener contrato existente.
   */
  async recordSessionStart(userId: string | undefined | null, planId?: string | null) {
    try {
      await trainingTrackingService.logTrainingSessionStart({ planId: planId ?? null });
    } catch {
      // Fallback a implementación previa para no romper comportamiento existente
      await this.logViaRPC({ userId, eventType: 'session_start', planId: planId ?? null });
    }
  }

  async recordSessionEnd(userId: string | undefined | null, planId?: string | null) {
    await this.logViaRPC({ userId, eventType: 'session_end', planId: planId ?? null });
  }

  async recordSetCompleted(
    userId: string | undefined | null,
    itemId: string,
    planId?: string | null,
    videoId?: string | null,
    setsCompleted?: number
  ) {
    await this.logViaRPC({
      userId,
      eventType: 'item_set_completed',
      planId: planId ?? null,
      itemId,
      videoId: videoId ?? null,
      metadata: typeof setsCompleted === 'number' ? { sets_completed: setsCompleted } : {},
    });
  }

  async recordItemCompleted(
    userId: string | undefined | null,
    itemId: string,
    planId?: string | null,
    videoId?: string | null
  ) {
    await this.logViaRPC({
      userId,
      eventType: 'item_completed',
      planId: planId ?? null,
      itemId,
      videoId: videoId ?? null,
    });
  }

  async recordPlanCompleted(userId: string | undefined | null, planId: string) {
    await this.logViaRPC({
      userId,
      eventType: 'plan_completed',
      planId,
    });
  }

  async recordPremiumBlock(userId: string | undefined | null, metadata?: Record<string, any>) {
    await this.logViaRPC({
      userId,
      eventType: 'premium_block',
      metadata,
    });
  }

  // Wrappers nuevos hacia trainingTrackingService

  /**
   * Registra el inicio de un ejercicio (wrapper).
   * Ignora userId; se usa la sesión actual via supabase.
   */
  async recordExerciseStarted(
    _userId: string | undefined | null,
    args: {
      sessionId?: string | null;
      planId?: string | null;
      itemId?: string | null;
      videoId?: string | null;
      timestamp?: string | Date;
      elapsedMs?: number | null;
      reps?: number | null;
      setIndex?: number | null;
      setsCompleted?: number | null;
      metadata?: Record<string, any> | null;
    }
  ) {
    await trainingTrackingService.logExerciseEvent({ type: 'started', ...args });
  }

  /**
   * Registra que un ejercicio fue saltado (wrapper).
   * Ignora userId; se usa la sesión actual via supabase.
   */
  async recordExerciseSkipped(
    _userId: string | undefined | null,
    args: {
      sessionId?: string | null;
      planId?: string | null;
      itemId?: string | null;
      videoId?: string | null;
      timestamp?: string | Date;
      elapsedMs?: number | null;
      reps?: number | null;
      setIndex?: number | null;
      setsCompleted?: number | null;
      metadata?: Record<string, any> | null;
    }
  ) {
    await trainingTrackingService.logExerciseEvent({ type: 'skipped', ...args });
  }

  // Lecturas básicas de estadísticas

  async getDailyStats(userId: string, from?: string, to?: string) {
    let query = supabase
      .from('daily_user_training_stats')
      .select('*')
      .eq('user_id', userId)
      .order('stat_date', { ascending: false });

    if (from) query = query.gte('stat_date', from);
    if (to) query = query.lte('stat_date', to);

    const { data, error } = await query;
    if (error) {
      // eslint-disable-next-line no-console
      console.warn('trainingAnalyticsService.getDailyStats error', error);
      return [];
    }
    return data || [];
  }

  async getAdherenceLast30(userId: string) {
    const { data, error } = await supabase
      .from('v_user_adherence_last_30')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('trainingAnalyticsService.getAdherenceLast30 error', error);
      return null;
    }
    return data;
  }

  async getWeekdayFailures(userId: string) {
    const { data, error } = await supabase
      .from('v_user_weekday_failures')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      // eslint-disable-next-line no-console
      console.warn('trainingAnalyticsService.getWeekdayFailures error', error);
      return [];
    }
    return data || [];
  }
}

export const trainingAnalyticsService = new TrainingAnalyticsService();
export default trainingAnalyticsService;