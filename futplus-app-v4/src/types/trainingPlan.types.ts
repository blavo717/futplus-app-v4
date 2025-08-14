import { VideoWithCategory } from '../services/videosService';

export type TrainingPlanStatus = 'draft' | 'active' | 'completed' | 'aborted';
export type TrainingPlanItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface TrainingPlan {
  id: string;
  user_id: string;
  plan_date: string; // YYYY-MM-DD (UTC)
  title: string | null;
  total_estimated_minutes: number;
  status: TrainingPlanStatus;
  created_at: string;
  updated_at: string;
}

export interface TrainingPlanItem {
  id: string;
  plan_id: string;
  video_id: string;
  order_index: number;
  category_slug: string | null;
  sets_total: number;
  sets_completed: number;
  rest_seconds: number;
  estimated_minutes: number;
  status: TrainingPlanItemStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;

  // Join opcional para render
  video?: VideoWithCategory | null;
}

export interface PlanWithItems {
  plan: TrainingPlan;
  items: TrainingPlanItem[];
}

export interface TodayPlanSummary {
  plan_id: string | null;
  status: TrainingPlanStatus | null;
  total_items: number;
  items_completed: number;
  total_estimated_minutes: number;
  minutes_completed: number;
}

export interface SurveyInput {
  exercisesCount: number;        // nº de ejercicios deseados
  categories: string[];          // slugs de categorías seleccionadas
  timeMinutes: number;           // tiempo disponible total
  subscriptionType: 'free' | 'premium';
  // Cuando está presente y es true durante la autogeneración silenciosa,
  // permite incluir videos premium en la selección inicial aunque el usuario sea free.
  // El gating real se mantiene en reproducción/preview.
  includePremiumDuringAutoGen?: boolean;
}

export interface UpdateSetsTotalInput {
  itemId: string;
  newSetsTotal: number;          // >= 1
}

export interface MarkSetCompletedInput {
  itemId: string;
  // Si se proporciona, fija explicitamente el valor; si no, se incrementa +1 con clamp [0..sets_total]
  nextValue?: number;
}

export type GeneratePlanResult =
  | { ok: true; plan: TrainingPlan; items: TrainingPlanItem[] }
  | { ok: false; reason: 'PLAN_HAS_PROGRESS' | 'NO_CANDIDATE_VIDEOS' | 'UNKNOWN'; message?: string };