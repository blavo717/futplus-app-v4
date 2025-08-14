# Tracking de Entrenamiento en Supabase

Este documento resume el modelo de datos, RPCs, vistas de analítica, servicios cliente y puntos de integración UI para registrar y analizar el entrenamiento de usuarios.

## Visión general (flujo)

1) UI/Hooks
- PlannerBottomSheet: registra propuesta diaria de plan.
- TrainingSessionOverlay: abre/cierra sesión de entrenamiento.
- PlanItemCard: emite eventos de ejercicios (started/completed/skipped).
- TodayPlanList: puede emitir skip a nivel de lista (opcional).

2) Servicios cliente
- trainingTrackingService: API de persistencia y lectura de estadísticas.
- trainingAnalyticsService: wrappers de compatibilidad.

3) Supabase
- Tablas: training_sessions, training_events, plan_proposals.
- RPC: log_training_event.
- Vistas: v_daily_user_training_stats, v_daily_plan_summary, v_user_adherence_last_30, v_user_weekday_failures.

## Esquema de Base de Datos

### Tabla: plan_proposals
Registro de propuestas de plan por usuario y fecha.
- id uuid PK
- user_id uuid NOT NULL (RLS: owner)
- plan_date date NOT NULL
- plan_id uuid NULL (FK → daily_training_plans.id o training_plans.id según proyecto)
- source text NOT NULL CHECK IN ('auto_silent','user_survey','ai_recommendation','coach_template','other')
- idempotency_key text NULL
- created_at timestamptz NOT NULL DEFAULT now()
- UNIQUE(user_id, plan_date, source)

RLS:
- SELECT/INSERT/UPDATE/DELETE con user_id = auth.uid()

Índices:
- (user_id, plan_date)
- (plan_id)

### Tabla: training_sessions
Sesiones de entrenamiento del usuario.
- id uuid PK
- user_id uuid NOT NULL (RLS: owner)
- plan_id uuid NULL (FK → daily_training_plans.id)
- started_at timestamptz NOT NULL DEFAULT now()
- ended_at timestamptz NULL
- duration_seconds int GENERATED ALWAYS AS (GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(ended_at, started_at) - started_at)))::int) STORED
- device text NULL
- app_version text NULL
- app_day_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date)
- status text NOT NULL DEFAULT 'active' CHECK IN ('active','ended','aborted')

RLS:
- SELECT/INSERT/UPDATE con user_id = auth.uid()
- DELETE: denegado (sin policy)

Índices:
- (user_id, started_at DESC), (plan_id), (status)

### Tabla: training_events
Bus de eventos de entrenamiento.
- id uuid PK
- user_id uuid NOT NULL (RLS: owner)
- session_id uuid NULL (FK → training_sessions.id)
- plan_id uuid NULL (FK → daily_training_plans.id)
- item_id uuid NULL (FK → daily_training_plan_items.id)
- video_id uuid NULL (FK → videos.id)
- event_type text NOT NULL CHECK IN (
  'plan_generated','session_start','session_end',
  'exercise_started','exercise_completed','exercise_skipped',
  'item_set_completed','item_completed','plan_completed',
  'video_preview','video_play','premium_block'
)
- event_time timestamptz NOT NULL DEFAULT now()
- app_day_date date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC')::date)
- elapsed_ms int NULL, reps int NULL, set_index int NULL, sets_completed int NULL
- metadata jsonb NOT NULL DEFAULT '{}'

RLS:
- SELECT USING (user_id = auth.uid()), INSERT WITH CHECK (user_id = auth.uid())
- UPDATE/DELETE: denegado

Índices:
- (user_id, event_time DESC), (user_id, event_type, event_time DESC), (session_id), (plan_id), (item_id), (video_id), (app_day_date)

## RPC

### log_training_event
Inserta de forma consistente un evento en training_events:
- Valida auth.uid() y coherencia del p_user_id con el contexto.
- Settea event_time=now() y app_day_date = (now() AT TIME ZONE 'UTC')::date.
- Devuelve id (uuid) insertado.

Firma:
- log_training_event(p_user_id uuid, p_event_type text, p_plan_id uuid DEFAULT NULL, p_item_id uuid DEFAULT NULL, p_video_id uuid DEFAULT NULL, p_session_id uuid DEFAULT NULL, p_elapsed_ms int DEFAULT NULL, p_reps int DEFAULT NULL, p_set_index int DEFAULT NULL, p_sets_completed int DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid

## Vistas de Analítica

### v_daily_user_training_stats
Estadísticas por usuario/día de app (app_day_date):
- user_id, stat_date
- exercises_completed
- exercises_skipped
- sessions_count
- minutes_estimated_completed (suma estimated_minutes de daily_training_plan_items para items completados ese día y pertenecientes al usuario)

Nota: Se une a daily_training_plan_items y daily_training_plans para asegurar ownership y sumar minutos.

### v_daily_plan_summary
Resumen por plan (daily_training_plans):
- user_id
- plan_id
- total_items
- items_completed
- total_estimated_minutes
- minutes_completed (aproximado por ratio sets_completed/sets_total)

### v_user_adherence_last_30
Adherencia de últimos 30 días:
- days_with_activity: días con ≥1 exercise_completed
- days_target_achieved: días con ≥3 exercise_completed
- adherence_pct: porcentaje sobre 30 días

### v_user_weekday_failures
Días por día-de-semana con actividad por debajo del objetivo (N=3) en últimas 12 semanas.

## Servicios Cliente (TypeScript)

Archivo: src/services/trainingTrackingService.ts
Funciones:
- logTrainingSessionStart(params?: { planId?: string | null, device?: string | null, appVersion?: string | null }): Promise<{ sessionId: string }>
- logTrainingSessionEnd(sessionId: string, params?: { status?: 'ended' | 'aborted', endedAt?: string | Date | null }): Promise<void>
- logExerciseEvent(event: {
  type: 'started' | 'completed' | 'skipped'
  sessionId?: string | null
  planId?: string | null
  itemId?: string | null
  videoId?: string | null
  timestamp?: string | Date
  elapsedMs?: number | null
  reps?: number | null
  setIndex?: number | null
  setsCompleted?: number | null
  metadata?: Record<string, any> | null
}): Promise<{ id: string }>
- upsertDailyPlanProposal(proposal: {
  planDate: string, source: 'auto_silent' | 'user_survey' | 'ai_recommendation' | 'coach_template' | 'other', planId?: string | null, idempotencyKey?: string | null
}): Promise<{ id: string }>
- getDailyProgress(planDate: string): Promise<{ planId: string | null, totalItems: number, itemsCompleted: number, totalEstimatedMinutes: number, minutesCompleted: number }>
- getWeeklyStats(options?: { from?: string, to?: string }): Promise<Array<{ statDate: string, exercisesCompleted: number, exercisesSkipped: number, sessionsCount: number, minutesEstimatedCompleted: number }>>
- getPlanAdherence(options?: { windowDays?: number, targetPerDay?: number }): Promise<{ daysWithActivity: number, daysTargetAchieved: number, adherencePct: number }>
- getUserStreak(): Promise<{ currentStreak: number, bestStreak: number | null }>

Wrappers en src/services/trainingAnalyticsService.ts:
- recordExerciseStarted, recordExerciseSkipped, recordSessionStart, recordSessionEnd delegando a trainingTrackingService.

## Integración UI

- PlannerBottomSheet
  - En confirmación/generación de plan: upsertDailyPlanProposal({ planDate, source, planId? })

- TrainingSessionOverlay
  - useEffect en mount: logTrainingSessionStart({ planId?, device: Platform.OS, appVersion })
  - cleanup: logTrainingSessionEnd(sessionId, { status: 'ended' })

- PlanItemCard
  - Al completar primer set: logExerciseEvent({ type:'started', ... })
  - Al completar todos los sets: logExerciseEvent({ type:'completed', ... })
  - Botón “skip” (si existe): logExerciseEvent({ type:'skipped', ... })

- TodayPlanList (opcional)
  - Si existe skip: logExerciseEvent({ type:'skipped', ... })

Buenas prácticas:
- Capturar errores y no bloquear la UI (best-effort).
- No escribir console.log en producción.
- Mantener RLS (usar cliente supabase autenticado).

## Consultas SQL útiles (ejemplos)

- Estadísticas diarias de hoy para usuario autenticado (ejemplo con UID estático):
```sql
SELECT *
FROM public.v_daily_user_training_stats
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND stat_date = (now() AT TIME ZONE 'UTC')::date;
```

- Adherencia últimos 30 días:
```sql
SELECT *
FROM public.v_user_adherence_last_30
WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;
```

- Top “skipped” por video:
```sql
SELECT v.id AS video_id, v.title, COUNT(*) AS skipped_count
FROM public.training_events e
JOIN public.videos v ON v.id = e.video_id
WHERE e.user_id = '00000000-0000-0000-0000-000000000000'::uuid
  AND e.event_type = 'exercise_skipped'
GROUP BY v.id, v.title
ORDER BY skipped_count DESC
LIMIT 20;
```

## Verificación E2E mínima

1) Crear sesión de entrenamiento:
```sql
INSERT INTO public.training_sessions (user_id, plan_id, device, app_version, status)
VALUES ('<uid>'::uuid, NULL, 'e2e', '1.0.0', 'active')
RETURNING id;
```

2) Insertar eventos (o vía RPC en cliente):
```sql
-- completado
INSERT INTO public.training_events (id, user_id, event_type, session_id, event_time, app_day_date)
VALUES (gen_random_uuid(), '<uid>'::uuid, 'exercise_completed', '<session_id>'::uuid, now(), (now() AT TIME ZONE 'UTC')::date);
-- skip
INSERT INTO public.training_events (id, user_id, event_type, session_id, event_time, app_day_date)
VALUES (gen_random_uuid(), '<uid>'::uuid, 'exercise_skipped', '<session_id>'::uuid, now(), (now() AT TIME ZONE 'UTC')::date);
```

3) Consultar vista:
```sql
SELECT *
FROM public.v_daily_user_training_stats
WHERE user_id='<uid>'::uuid
ORDER BY stat_date DESC
LIMIT 10;
```

4) (Opcional) Sumar minutos estimados: crear daily_training_plans/daily_training_plan_items e insertar un evento con item_id; verificar que minutes_estimated_completed > 0.

## Seguridad y Retención

- RLS por user_id en todas las tablas sensibles.
- Retención recomendada: training_events 180 días, training_sessions 180-365 días, plan_proposals 90 días.
- Metadata JSONB estable y sin PII.

## Evoluciones futuras

- Parametrizar objetivo diario (N) y ventana de adherencia.
- Materialized views si el volumen crece (refresco diario).
- Enriquecer minutes_estimated_completed por sets completados parciales si se requiere precisión.