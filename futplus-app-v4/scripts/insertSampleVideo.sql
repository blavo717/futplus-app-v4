-- Script SQL para insertar video de muestra
-- Ejecutar en el panel de Supabase: Database > SQL Editor

-- 1. Insertar categoría de técnica si no existe
INSERT INTO video_categories (name, slug, description, icon, order_index)
VALUES ('Técnica', 'tecnica', 'Videos enfocados en mejorar la técnica individual', 'football', 1)
ON CONFLICT (slug) DO NOTHING;

-- 2. Insertar video de muestra
INSERT INTO videos (
  title,
  description,
  video_url,
  duration,
  category,
  category_id,
  level,
  position,
  is_premium,
  tags,
  view_count,
  order_index
) VALUES (
  'Entrenamiento Básico de Fútbol',
  'Aprende las técnicas fundamentales del fútbol con este entrenamiento básico. Perfecto para principiantes que quieren mejorar su control de balón, pases y tiro.',
  'videos/free/entrenamiento-basico-01.mp4',
  1800, -- 30 minutos
  'technique',
  (SELECT id FROM video_categories WHERE slug = 'tecnica'),
  'beginner',
  ARRAY['midfielder', 'forward'],
  false, -- Gratuito
  ARRAY['básico', 'técnica', 'principiantes', 'control', 'pases'],
  0,
  1
);

-- 3. Verificar inserción
SELECT 
  v.id,
  v.title,
  v.duration,
  v.category,
  v.level,
  v.is_premium,
  v.video_url,
  vc.name as category_name
FROM videos v
LEFT JOIN video_categories vc ON v.category_id = vc.id
ORDER BY v.created_at DESC
LIMIT 5;