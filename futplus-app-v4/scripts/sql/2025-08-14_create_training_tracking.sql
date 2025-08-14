-- =====================================
-- Training Tracking Persistence - 2025-08-14
-- =====================================

-- Safe search_path and required extensions
SET search_path = public;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================
-- Table: plan_proposals
-- =====================================
CREATE TABLE IF NOT EXISTS public.plan_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  plan_id uuid NULL REFERENCES public.training_plans(id) ON DELETE SET NULL,
  source text NOT NULL CHECK (source IN ('auto_silent','user_survey','ai_recommendation','coach_template','other')),
  idempotency_key text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_date, source)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_proposals_user_date ON public.plan_proposals (user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_plan_proposals_plan_id ON public.plan_proposals (plan_id);

-- RLS
ALTER TABLE public.plan_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pp_select_own" ON public.plan_proposals;
CREATE POLICY "pp_select_own" ON public.plan_proposals
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "pp_insert_own" ON public.plan_proposals;
CREATE POLICY "pp_insert_own" ON public.plan_proposals
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "pp_update_own" ON public.plan_proposals;
CREATE POLICY "pp_update_own" ON public.plan_proposals
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "pp_delete_own" ON public.plan_proposals;
CREATE POLICY "pp_delete_own" ON public.plan_proposals
  FOR DELETE USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE public.plan_proposals IS 'Propuestas de plan para un usuario y fecha de planificación. Origen puede ser automático, encuesta, AI, etc.';
COMMENT ON COLUMN public.plan_proposals.user_id IS 'Usuario propietario de la propuesta (RLS por usuario).';
COMMENT ON COLUMN public.plan_proposals.plan_date IS 'Fecha del plan propuesto (zona lógica de app).';
COMMENT ON COLUMN public.plan_proposals.source IS 'Origen de la propuesta: auto_silent, user_survey, ai_recommendation, coach_template, other.';

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.plan_proposals TO authenticated;

-- =====================================
-- Table: training_sessions
-- =====================================
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NULL REFERENCES public.training_plans(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz NULL,
  duration_seconds int GENERATED ALWAYS AS (
    GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(ended_at, started_at) - started_at)))::int
  ) STORED,
  device text NULL,
  app_version text NULL,
  app_day_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','aborted'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_started_desc ON public.training_sessions (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_sessions_plan_id ON public.training_sessions (plan_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON public.training_sessions (status);

-- RLS
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ts_select_own" ON public.training_sessions;
CREATE POLICY "ts_select_own" ON public.training_sessions
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ts_insert_own" ON public.training_sessions;
CREATE POLICY "ts_insert_own" ON public.training_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "ts_update_own" ON public.training_sessions;
CREATE POLICY "ts_update_own" ON public.training_sessions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- No DELETE policy (denegado por defecto)

-- Comments
COMMENT ON TABLE public.training_sessions IS 'Sesiones de entrenamiento iniciadas por el usuario.';
COMMENT ON COLUMN public.training_sessions.user_id IS 'Usuario propietario de la sesión (RLS).';
COMMENT ON COLUMN public.training_sessions.app_day_date IS 'Fecha lógica de la app (UTC) asociada al inicio de la sesión.';
COMMENT ON COLUMN public.training_sessions.status IS 'Estado de la sesión: active, ended, aborted.';

-- Grants
GRANT SELECT, INSERT, UPDATE ON public.training_sessions TO authenticated;

-- =====================================
-- Table: training_events
-- =====================================
CREATE TABLE IF NOT EXISTS public.training_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NULL REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  plan_id uuid NULL REFERENCES public.training_plans(id) ON DELETE SET NULL,
  item_id uuid NULL REFERENCES public.training_plan_items(id) ON DELETE SET NULL,
  video_id uuid NULL REFERENCES public.videos(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('plan_generated','session_start','session_end','exercise_started','exercise_completed','exercise_skipped','item_set_completed','item_completed','plan_completed','video_preview','video_play','premium_block')),
  event_time timestamptz NOT NULL DEFAULT now(),
  app_day_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date),
  elapsed_ms int NULL,
  reps int NULL,
  set_index int NULL,
  sets_completed int NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_events_user_time_desc ON public.training_events (user_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_training_events_user_type_time_desc ON public.training_events (user_id, event_type, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_training_events_session_id ON public.training_events (session_id);
CREATE INDEX IF NOT EXISTS idx_training_events_plan_id ON public.training_events (plan_id);
CREATE INDEX IF NOT EXISTS idx_training_events_item_id ON public.training_events (item_id);
CREATE INDEX IF NOT EXISTS idx_training_events_video_id ON public.training_events (video_id);
CREATE INDEX IF NOT EXISTS idx_training_events_app_day_date ON public.training_events (app_day_date);

-- RLS
ALTER TABLE public.training_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "te_select_own" ON public.training_events;
CREATE POLICY "te_select_own" ON public.training_events
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "te_insert_own" ON public.training_events;
CREATE POLICY "te_insert_own" ON public.training_events
  FOR INSERT WITH CHECK (user_id = auth.uid());
-- Sin policies UPDATE/DELETE (denegado por defecto)

-- Comments
COMMENT ON TABLE public.training_events IS 'Eventos de entrenamiento y telemetría asociados a sesiones/planes/items/videos.';
COMMENT ON COLUMN public.training_events.user_id IS 'Usuario propietario (RLS).';
COMMENT ON COLUMN public.training_events.app_day_date IS 'Fecha lógica de la app (UTC) para agregaciones diarias.';
COMMENT ON COLUMN public.training_events.event_type IS 'Tipo de evento normalizado.';

-- Grants
GRANT SELECT, INSERT ON public.training_events TO authenticated;

-- =====================================
-- RPC: log_training_event
-- =====================================
CREATE OR REPLACE FUNCTION public.log_training_event(
  p_user_id uuid,
  p_event_type text,
  p_plan_id uuid DEFAULT NULL,
  p_item_id uuid DEFAULT NULL,
  p_video_id uuid DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_elapsed_ms int DEFAULT NULL,
  p_reps int DEFAULT NULL,
  p_set_index int DEFAULT NULL,
  p_sets_completed int DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'auth.uid() is null';
  END IF;

  IF p_user_id IS NOT NULL AND p_user_id <> v_user_id THEN
    RAISE EXCEPTION 'user mismatch';
  END IF;

  INSERT INTO public.training_events(
    id, user_id, session_id, plan_id, item_id, video_id,
    event_type, event_time, app_day_date,
    elapsed_ms, reps, set_index, sets_completed, metadata
  ) VALUES (
    gen_random_uuid(), v_user_id, p_session_id, p_plan_id, p_item_id, p_video_id,
    p_event_type, now(), (now() AT TIME ZONE 'UTC')::date,
    p_elapsed_ms, p_reps, p_set_index, p_sets_completed, COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_training_event(
  uuid, text, uuid, uuid, uuid, uuid, int, int, int, int, jsonb
) TO authenticated;
REVOKE ALL ON FUNCTION public.log_training_event(
  uuid, text, uuid, uuid, uuid, uuid, int, int, int, int, jsonb
) FROM anon;

-- =====================================
-- Analytics Views
-- =====================================
-- Drop existing if present to allow re-run (no IF NOT EXISTS)
DROP VIEW IF EXISTS public.v_daily_user_training_stats;
CREATE VIEW public.v_daily_user_training_stats AS
WITH base AS (
  SELECT
    user_id,
    app_day_date,
    COUNT(*) FILTER (WHERE event_type = 'exercise_completed') AS exercises_completed,
    COUNT(*) FILTER (WHERE event_type = 'exercise_skipped') AS exercises_skipped,
    COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions_count
  FROM public.training_events
  GROUP BY user_id, app_day_date
),
minutes AS (
  SELECT
    e.user_id,
    e.app_day_date,
    COALESCE(SUM(COALESCE(tpi.estimated_minutes, 0)), 0) AS minutes_estimated_completed
  FROM (
    SELECT DISTINCT user_id, app_day_date, item_id
    FROM public.training_events
    WHERE event_type IN ('exercise_completed','item_completed')
      AND item_id IS NOT NULL
  ) e
  LEFT JOIN public.training_plan_items tpi
    ON tpi.id = e.item_id
  GROUP BY e.user_id, e.app_day_date
)
SELECT
  b.user_id,
  b.app_day_date AS stat_date,
  b.exercises_completed,
  b.exercises_skipped,
  b.sessions_count,
  COALESCE(m.minutes_estimated_completed, 0) AS minutes_estimated_completed
FROM base b
LEFT JOIN minutes m
  ON m.user_id = b.user_id AND m.app_day_date = b.app_day_date;

COMMENT ON VIEW public.v_daily_user_training_stats IS 'Estadísticas diarias por usuario a partir de training_events.';

DROP VIEW IF EXISTS public.v_daily_plan_summary;
CREATE VIEW public.v_daily_plan_summary AS
SELECT
  tpi.plan_id,
  COUNT(*) AS total_items,
  COUNT(*) FILTER (WHERE tpi.status = 'completed') AS items_completed,
  COALESCE(SUM(tpi.estimated_minutes), 0) AS total_estimated_minutes,
  COALESCE(
    SUM(
      (tpi.estimated_minutes::numeric)
      * LEAST(1.0, GREATEST(0.0, COALESCE(tpi.sets_completed,0)::numeric / NULLIF(tpi.sets_total,0)::numeric))
    )::int
  , 0) AS minutes_completed
FROM public.training_plan_items tpi
GROUP BY tpi.plan_id;

COMMENT ON VIEW public.v_daily_plan_summary IS 'Resumen por plan a partir de training_plan_items.';

DROP VIEW IF EXISTS public.v_user_adherence_last_30;
CREATE VIEW public.v_user_adherence_last_30 AS
WITH daily AS (
  SELECT
    user_id,
    app_day_date,
    COUNT(*) FILTER (WHERE event_type = 'exercise_completed') AS completed_count
  FROM public.training_events
  WHERE app_day_date >= ((now() AT TIME ZONE 'UTC')::date - INTERVAL '30 days')
  GROUP BY user_id, app_day_date
)
SELECT
  d.user_id,
  COUNT(*) FILTER (WHERE d.completed_count >= 1) AS days_with_activity,
  COUNT(*) FILTER (WHERE d.completed_count >= 3) AS days_target_achieved,
  ROUND(
    (COUNT(*) FILTER (WHERE d.completed_count >= 3)) * 100.0 / 30.0
  , 2) AS adherence_pct
FROM daily d
GROUP BY d.user_id;

COMMENT ON VIEW public.v_user_adherence_last_30 IS 'Adherencia del usuario en los últimos 30 días (N=3 ejercicios/día).';

-- Opcional
DROP VIEW IF EXISTS public.v_user_weekday_failures;
CREATE VIEW public.v_user_weekday_failures AS
WITH daily AS (
  SELECT
    user_id,
    app_day_date AS day,
    COUNT(*) FILTER (WHERE event_type = 'exercise_completed') AS completed_count
  FROM public.training_events
  WHERE app_day_date >= ((now() AT TIME ZONE 'UTC')::date - INTERVAL '84 days')
  GROUP BY user_id, app_day_date
)
SELECT
  user_id,
  EXTRACT(DOW FROM day)::int AS weekday,
  COUNT(*) FILTER (WHERE completed_count < 3) AS days_below_target
FROM daily
GROUP BY user_id, EXTRACT(DOW FROM day)::int;

COMMENT ON VIEW public.v_user_weekday_failures IS 'Días por usuario y día de semana en que no se alcanza el objetivo (N=3) en últimas 12 semanas.';

-- =====================================
-- End of file
-- =====================================