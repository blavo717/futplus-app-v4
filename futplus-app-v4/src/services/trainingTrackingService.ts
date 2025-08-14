import { supabase } from '../config/supabase';

/**
 * Obtiene el UID del usuario autenticado actual.
 * Lanza error si no hay sesión.
 */
async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`getCurrentUserId: error al leer sesión: ${error.message}`);
  }
  const uid = data?.user?.id;
  if (!uid) {
    throw new Error('getCurrentUserId: no hay sesión activa');
  }
  return uid;
}

// Tipos públicos
export type ExerciseEventType = 'started' | 'completed' | 'skipped';

export interface TrainingSessionStartParams {
  planId?: string | null;
  device?: string | null;
  appVersion?: string | null;
}

export interface ExerciseEventPayload {
  type: ExerciseEventType;
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

export interface DailyProgress {
  planId: string | null;
  totalItems: number;
  itemsCompleted: number;
  totalEstimatedMinutes: number;
  minutesCompleted: number;
}

export interface WeeklyStat {
  statDate: string;
  exercisesCompleted: number;
  exercisesSkipped: number;
  sessionsCount: number;
  minutesEstimatedCompleted: number;
}

export interface PlanAdherence {
  daysWithActivity: number;
  daysTargetAchieved: number;
  adherencePct: number;
}

export interface UserStreak {
  currentStreak: number;
  bestStreak: number | null;
}

function mapEventType(t: ExerciseEventType): string {
  switch (t) {
    case 'started':
      return 'exercise_started';
    case 'completed':
      return 'exercise_completed';
    case 'skipped':
      return 'exercise_skipped';
    default:
      return t;
  }
}

/**
 * Inicia una sesión de entrenamiento creando un registro en training_sessions.
 * @param params Datos opcionales del inicio de sesión.
 * @returns Identificador de la sesión creada.
 */
export async function logTrainingSessionStart(
  params?: TrainingSessionStartParams
): Promise<{ sessionId: string }> {
  const uid = await getCurrentUserId();
  const payload = {
    user_id: uid,
    plan_id: params?.planId ?? null,
    device: params?.device ?? null,
    app_version: params?.appVersion ?? null,
    status: 'active' as const,
  };

  const { data, error } = await supabase
    .from('training_sessions')
    .insert([payload])
    .select('id')
    .single();

  if (error) {
    throw new Error(`logTrainingSessionStart: error al insertar sesión: ${error.message}`);
  }

  return { sessionId: (data as any).id as string };
}

/**
 * Finaliza una sesión de entrenamiento existente.
 * @param sessionId ID de la sesión a finalizar.
 * @param params Estado y fecha de fin opcionales.
 */
export async function logTrainingSessionEnd(
  sessionId: string,
  params?: { status?: 'ended' | 'aborted'; endedAt?: string | Date | null }
): Promise<void> {
  // Garantiza sesión válida para cumplir RLS de UPDATE por owner
  await getCurrentUserId();
  const endedAt =
    params?.endedAt instanceof Date
      ? params?.endedAt.toISOString()
      : (params?.endedAt as string | null) ?? new Date().toISOString();

  const { error } = await supabase
    .from('training_sessions')
    .update({
      ended_at: endedAt,
      status: params?.status ?? 'ended',
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`logTrainingSessionEnd: error al actualizar sesión: ${error.message}`);
  }
}

/**
 * Registra un evento de ejercicio vía RPC log_training_event.
 * @param event Datos del evento.
 * @returns ID del evento creado.
 */
export async function logExerciseEvent(event: ExerciseEventPayload): Promise<{ id: string }> {
  const uid = await getCurrentUserId();
  const rpcPayload: Record<string, any> = {
    p_user_id: uid,
    p_event_type: mapEventType(event.type),
    p_plan_id: event.planId ?? null,
    p_item_id: event.itemId ?? null,
    p_video_id: event.videoId ?? null,
    p_session_id: event.sessionId ?? null,
    p_elapsed_ms: event.elapsedMs ?? null,
    p_reps: event.reps ?? null,
    p_set_index: event.setIndex ?? null,
    p_sets_completed: event.setsCompleted ?? null,
    p_metadata: event.metadata ?? {},
  };

  const { data, error } = await supabase.rpc('log_training_event', rpcPayload);
  if (error) {
    throw new Error(`logExerciseEvent (RPC log_training_event): ${error.message}`);
  }
  // El RPC retorna el UUID de la fila creada
  return { id: data as unknown as string };
}

/**
 * Crea o actualiza (upsert) una propuesta diaria de plan.
 */
export async function upsertDailyPlanProposal(proposal: {
  planDate: string;
  source: 'auto_silent' | 'user_survey' | 'ai_recommendation' | 'coach_template' | 'other';
  planId?: string | null;
  idempotencyKey?: string | null;
}): Promise<{ id: string }> {
  const uid = await getCurrentUserId();
  const { data, error } = await supabase
    .from('plan_proposals')
    .upsert(
      [
        {
          user_id: uid,
          plan_date: proposal.planDate,
          source: proposal.source,
          plan_id: proposal.planId ?? null,
          idempotency_key: proposal.idempotencyKey ?? null,
        },
      ],
      { onConflict: 'user_id,plan_date,source' }
    )
    .select('id')
    .single();

  if (error) {
    throw new Error(`upsertDailyPlanProposal: error en upsert: ${error.message}`);
  }

  return { id: (data as any).id as string };
}

/**
 * Devuelve progreso diario del plan del usuario para una fecha.
 */
export async function getDailyProgress(planDate: string): Promise<DailyProgress> {
  const uid = await getCurrentUserId();

  // Buscar plan del usuario por fecha
  const { data: planRow, error: planErr } = await supabase
    .from('training_plans')
    .select('id')
    .eq('user_id', uid)
    .eq('plan_date', planDate)
    .maybeSingle();

  if (planErr) {
    throw new Error(`getDailyProgress: error buscando plan: ${planErr.message}`);
  }

  if (!planRow?.id) {
    return {
      planId: null,
      totalItems: 0,
      itemsCompleted: 0,
      totalEstimatedMinutes: 0,
      minutesCompleted: 0,
    };
  }

  const planId = planRow.id as string;
  const { data: summary, error: sumErr } = await supabase
    .from('v_daily_plan_summary')
    .select('*')
    .eq('plan_id', planId)
    .maybeSingle();

  if (sumErr) {
    throw new Error(`getDailyProgress: error leyendo v_daily_plan_summary: ${sumErr.message}`);
  }

  return {
    planId,
    totalItems: (summary?.total_items as number) ?? 0,
    itemsCompleted: (summary?.items_completed as number) ?? 0,
    totalEstimatedMinutes: (summary?.total_estimated_minutes as number) ?? 0,
    minutesCompleted: (summary?.minutes_completed as number) ?? 0,
  };
}

/**
 * Devuelve estadísticas diarias en un rango (ordenadas desc).
 */
export async function getWeeklyStats(options?: {
  from?: string;
  to?: string;
}): Promise<WeeklyStat[]> {
  const uid = await getCurrentUserId();
  let query = supabase
    .from('daily_user_training_stats')
    .select('*')
    .eq('user_id', uid)
    .order('stat_date', { ascending: false });

  if (options?.from) query = query.gte('stat_date', options.from);
  if (options?.to) query = query.lte('stat_date', options.to);

  const { data, error } = await query;
  if (error) {
    throw new Error(`getWeeklyStats: error leyendo estadísticas: ${error.message}`);
  }

  const rows = (data ?? []) as any[];
  return rows.map((r) => ({
    statDate: r.stat_date as string,
    exercisesCompleted: (r.exercises_completed as number) ?? 0,
    exercisesSkipped: (r.exercises_skipped as number) ?? 0,
    sessionsCount: (r.sessions_count as number) ?? 0,
    minutesEstimatedCompleted: (r.minutes_estimated_completed as number) ?? 0,
  }));
}

/**
 * Devuelve adherencia del usuario (últimos 30 días).
 */
export async function getPlanAdherence(_options?: {
  windowDays?: number;
  targetPerDay?: number;
}): Promise<PlanAdherence> {
  const uid = await getCurrentUserId();
  const { data, error } = await supabase
    .from('v_user_adherence_last_30')
    .select('*')
    .eq('user_id', uid)
    .single();

  if (error) {
    throw new Error(`getPlanAdherence: error leyendo vista: ${error.message}`);
  }

  return {
    daysWithActivity: (data?.days_with_activity as number) ?? 0,
    daysTargetAchieved: (data?.days_target_achieved as number) ?? 0,
    adherencePct: (data?.adherence_pct as number) ?? 0,
  };
}

function toUTCDateString(d: Date): string {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calcula la racha de días consecutivos con al menos un ejercicio completado.
 */
export async function getUserStreak(): Promise<UserStreak> {
  const uid = await getCurrentUserId();
  const { data, error } = await supabase
    .from('training_events')
    .select('app_day_date')
    .eq('user_id', uid)
    .eq('event_type', 'exercise_completed')
    .order('app_day_date', { ascending: true });

  if (error) {
    throw new Error(`getUserStreak: error leyendo eventos: ${error.message}`);
  }

  const dates: string[] = Array.from(
    new Set(((data ?? []) as any[]).map((r) => r.app_day_date as string))
  ).sort();

  // Calcular bestStreak y currentStreak
  let bestStreak = 0;
  let currentStreak = 0;
  let prev: Date | null = null;

  for (const ds of dates) {
    const d = new Date(`${ds}T00:00:00.000Z`);
    if (prev) {
      const diffDays = Math.round((d.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        bestStreak = Math.max(bestStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    prev = d;
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  // Racha actual hasta hoy (UTC)
  const today = toUTCDateString(new Date());
  const dateSet = new Set(dates);
  let rolling = 0;
  let probe = new Date(`${today}T00:00:00.000Z`);
  while (dateSet.has(toUTCDateString(probe))) {
    rolling += 1;
    probe = new Date(probe.getTime() - 86400000);
  }

  return { currentStreak: rolling, bestStreak: bestStreak || null };
}

// Export por defecto cómodo
const trainingTrackingService = {
  logTrainingSessionStart,
  logTrainingSessionEnd,
  logExerciseEvent,
  upsertDailyPlanProposal,
  getDailyProgress,
  getWeeklyStats,
  getPlanAdherence,
  getUserStreak,
};

export default trainingTrackingService;