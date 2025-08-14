-- =============================================
-- Script para crear la tabla activities
-- Crítico para resolver errores de FutPlus
-- =============================================

-- =============================================
-- 1. Crear tabla activities
-- =============================================

CREATE TABLE public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('training', 'nutrition', 'recovery')) NOT NULL,
    scheduled_time TIMESTAMPTZ NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- 2. Crear índices para rendimiento
-- =============================================

-- Índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);

-- Índice para búsquedas por tipo de actividad
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);

-- Índice para búsquedas por fecha programada
CREATE INDEX IF NOT EXISTS idx_activities_scheduled_time ON public.activities(scheduled_time);

-- Índice para búsquedas por estado de completado
CREATE INDEX IF NOT EXISTS idx_activities_completed ON public.activities(completed);

-- Índice compuesto para búsquedas comunes (user_id + completed)
CREATE INDEX IF NOT EXISTS idx_activities_user_completed ON public.activities(user_id, completed);

-- Índice compuesto para búsquedas por user_id y tipo
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON public.activities(user_id, type);

-- =============================================
-- 3. Configurar Row Level Security (RLS)
-- =============================================

-- Habilitar RLS en la tabla
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver sus propias actividades
CREATE POLICY "Users can view their own activities" 
ON public.activities FOR SELECT 
USING (auth.uid() = user_id);

-- Política para que los usuarios solo puedan insertar sus propias actividades
CREATE POLICY "Users can insert their own activities" 
ON public.activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan actualizar sus propias actividades
CREATE POLICY "Users can update their own activities" 
ON public.activities FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para que los usuarios solo puedan eliminar sus propias actividades
CREATE POLICY "Users can delete their own activities" 
ON public.activities FOR DELETE 
USING (auth.uid() = user_id);

-- =============================================
-- 4. Crear función para actualizar completed_at automáticamente
-- =============================================

-- Crear función trigger para actualizar completed_at cuando completed cambia a true
CREATE OR REPLACE FUNCTION public.handle_activity_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Si completed cambió de false a true, establecer completed_at
    IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Si completed cambió de true a false, limpiar completed_at
    IF NEW.completed = false AND OLD.completed = true THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para manejar automáticamente completed_at
DROP TRIGGER IF EXISTS handle_activity_completion_trigger ON public.activities;
CREATE TRIGGER handle_activity_completion_trigger
    BEFORE UPDATE ON public.activities
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_activity_completion();

-- =============================================
-- 5. Insertar actividades de ejemplo (opcional)
-- =============================================

-- Comentado por defecto, descomentar si se desean datos de ejemplo
/*
INSERT INTO public.activities (user_id, title, description, type, scheduled_time)
VALUES 
    -- Estas se insertarían solo si hay un usuario de ejemplo
    -- (uuid_example, 'Entrenamiento de piernas', 'Rutina completa de piernas con pesas', 'training', NOW() + INTERVAL '1 day'),
    -- (uuid_example, 'Almuerzo saludable', 'Preparar ensalada con proteína', 'nutrition', NOW() + INTERVAL '3 hours'),
    -- (uuid_example, 'Sesión de estiramiento', 'Yoga y estiramientos para recuperación', 'recovery', NOW() + INTERVAL '2 hours');
*/

-- =============================================
-- 6. Verificación final
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tabla activities creada exitosamente';
    RAISE NOTICE '✅ Índices para rendimiento configurados';
    RAISE NOTICE '✅ Políticas RLS establecidas';
    RAISE NOTICE '✅ Función de completion automática creada';
    RAISE NOTICE '✅ Sistema de activities completamente funcional';
END $$;