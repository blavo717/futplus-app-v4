-- Permitir SELECT de thumbnails del bucket 'videos' a usuarios autenticados
-- Mantiene privado el resto del contenido (p. ej. .mp4); solo habilita listar/firmar objetos bajo 'thumbnails'
-- Fecha: 2025-08-12
-- Tabla: storage.objects

-- Política idempotente: eliminar si existe y volver a crear
DROP POLICY IF EXISTS "allow_thumbnails_select_authenticated" ON storage.objects;

CREATE POLICY "allow_thumbnails_select_authenticated"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos'
  AND (
    name LIKE 'thumbnails/%'         -- thumbnails en la raíz del bucket
    OR name LIKE '%/thumbnails/%'    -- thumbnails dentro de subcarpetas (free/thumbnails, premium/thumbnails, etc.)
  )
);

Notas
- Esta política habilita únicamente SELECT (lectura/firmado) para objetos cuyo nombre contenga el segmento 'thumbnails'. No modifica permisos sobre los .mp4 ni otros objetos.
- Las políticas se combinan con OR; no elimina restricciones existentes para otros paths.