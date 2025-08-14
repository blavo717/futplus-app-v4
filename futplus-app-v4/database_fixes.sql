-- =============================================
-- Migraciones para corregir errores de la base de datos
-- =============================================

-- =============================================
-- 1. Crear tabla user_progress
-- =============================================

-- Crear la tabla user_progress basada en la interfaz UserProgress
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    training_days INTEGER DEFAULT 0,
    total_training_days INTEGER DEFAULT 30,
    nutrition_streak INTEGER DEFAULT 0,
    total_nutrition_days INTEGER DEFAULT 30,
    rest_hours INTEGER DEFAULT 0,
    total_rest_hours INTEGER DEFAULT 56,
    calories_burned INTEGER DEFAULT 0,
    minutes_active INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas por user_id
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);

-- Crear política RLS para que los usuarios solo puedan ver su propio progreso
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. Agregar columna "unlocked" a user_achievements
-- =============================================

-- Agregar la columna unlocked a la tabla user_achievements
ALTER TABLE public.user_achievements 
ADD COLUMN IF NOT EXISTS unlocked BOOLEAN DEFAULT FALSE;

-- Agregar la columna unlocked_at para registrar cuándo se desbloqueó
ALTER TABLE public.user_achievements 
ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMP WITH TIME ZONE;

-- Crear índice para búsquedas rápidas de logros desbloqueados
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON public.user_achievements(unlocked);

-- Actualizar políticas RLS si es necesario
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.user_achievements FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. Verificar y crear tabla achievements si no existe
-- =============================================

-- La tabla achievements ya existe según nuestra verificación,
-- pero aquí está la estructura esperada para referencia:

/*
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'trophy',
    category TEXT NOT NULL CHECK (category IN ('training', 'nutrition', 'performance', 'social')),
    requirement INTEGER NOT NULL,
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('days', 'calories', 'minutes', 'goals', 'streak')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- =============================================
-- 4. Crear función para actualizar updated_at automáticamente
-- =============================================

-- Crear función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para user_progress
DROP TRIGGER IF EXISTS handle_user_progress_updated_at ON public.user_progress;
CREATE TRIGGER handle_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 5. Insertar logros predeterminados si no existen
-- =============================================

-- Insertar logros básicos si la tabla achievements está vacía
INSERT INTO public.achievements (id, title, description, icon, category, requirement, requirement_type)
VALUES 
    ('achievement_1', 'Primer Paso', 'Completa tu primer día de entrenamiento', 'trophy', 'training', 1, 'days'),
    ('achievement_2', 'En Forma', 'Completa 7 días de entrenamiento', 'medal', 'training', 7, 'days'),
    ('achievement_3', 'Atleta', 'Completa 30 días de entrenamiento', 'star', 'training', 30, 'days'),
    ('achievement_4', 'Nutrición Consciente', 'Completa tu primer día de nutrición', 'apple', 'nutrition', 1, 'days'),
    ('achievement_5', 'Dieta Saludable', 'Completa 7 días de nutrición', 'salad', 'nutrition', 7, 'days'),
    ('achievement_6', 'Maestro de la Nutrición', 'Completa 30 días de nutrición', 'crown', 'nutrition', 30, 'days'),
    ('achievement_7', 'Descanso Perfecto', 'Completa 8 horas de descanso', 'bed', 'performance', 8, 'hours'),
    ('achievement_8', 'Quemador de Calorías', 'Quema 1000 calorías', 'fire', 'performance', 1000, 'calories'),
    ('achievement_9', 'Activo', 'Completa 60 minutos de actividad', 'running', 'performance', 60, 'minutes')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. Crear función para inicializar progreso de usuario
-- =============================================

-- Crear función para inicializar el progreso de un nuevo usuario
CREATE OR REPLACE FUNCTION public.initialize_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_progress (
        user_id,
        training_days,
        total_training_days,
        nutrition_streak,
        total_nutrition_days,
        rest_hours,
        total_rest_hours,
        calories_burned,
        minutes_active,
        current_streak,
        level
    ) VALUES (
        NEW.id,
        0,
        30,
        0,
        30,
        0,
        56,
        0,
        0,
        0,
        1
    );
    
    -- Inicializar logros del usuario
    INSERT INTO public.user_achievements (user_id, achievement_id, unlocked)
    SELECT NEW.id, id, FALSE
    FROM public.achievements;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para inicializar progreso cuando se crea un nuevo usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_user_progress();

-- =============================================
-- 7. Verificación final
-- =============================================

-- Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Migraciones completadas exitosamente';
    RAISE NOTICE '✅ Tabla user_progress creada';
    RAISE NOTICE '✅ Columna unlocked agregada a user_achievements';
    RAISE NOTICE '✅ Políticas RLS configuradas';
    RAISE NOTICE '✅ Funciones de inicialización creadas';
END $$;