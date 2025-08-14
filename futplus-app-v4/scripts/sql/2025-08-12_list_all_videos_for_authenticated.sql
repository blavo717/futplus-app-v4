-- Habilitar listado de metadatos de videos (incluye premium) a usuarios autenticados
-- Mantiene RLS; sólo amplía la visibilidad de filas. El gating de reproducción sigue dependiendo de URLs firmadas.
-- Fecha: 2025-08-12
-- Tabla: public.videos

-- Política para permitir listar todas las filas a usuarios autenticados
DROP POLICY IF EXISTS "list_all_videos_authenticated" ON public.videos;

CREATE POLICY "list_all_videos_authenticated"
ON public.videos
FOR SELECT
TO authenticated
USING (true);

-- Asegurar privilegio SELECT (RLS continuará aplicando)
GRANT SELECT ON public.videos TO authenticated;

Notas:
- Esta política se OR-iza con las existentes. No elimina otras políticas; únicamente añade una vía más para SELECT.
- DROP POLICY IF EXISTS elimina la política con el mismo nombre si existe, y luego se crea con la misma definición (idempotencia práctica y segura).