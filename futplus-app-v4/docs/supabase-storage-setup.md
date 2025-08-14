# Configuración Manual de Supabase Storage para Videos

## 1. Crear Bucket en Panel de Supabase

1. Ve al panel de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto FutPlus
3. Ve a "Storage" en el menú lateral
4. Haz clic en "Create bucket"
5. Configuración del bucket:
   - **Name**: `videos`
   - **Public**: ❌ **NO** (debe ser privado)
   - **File size limit**: 100MB (puedes ajustar después)
   - **Allowed MIME types**: `video/mp4, video/quicktime, video/x-msvideo`

## 2. Crear Estructura de Carpetas

Una vez creado el bucket, crea la estructura de carpetas:

```
videos/
├── free/     # Videos accesibles para usuarios gratuitos
└── premium/  # Videos solo para usuarios premium
```

Para crear las carpetas:
1. Entra al bucket "videos"
2. Haz clic en "Create folder"
3. Crea carpeta `free`
4. Crea carpeta `premium`

## 3. Configurar Políticas RLS

Ve a "Database" > "Tables" > "storage" > "objects" y agrega estas políticas:

### Política 1: Videos Gratuitos
```sql
CREATE POLICY "Usuarios pueden ver videos gratuitos" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'videos' AND
  (storage.foldername(name))[1] = 'free'
);
```

### Política 2: Videos Premium
```sql
CREATE POLICY "Usuarios premium pueden ver todos los videos" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.subscription_type = 'premium'
    AND profiles.subscription_status = 'active'
  )
);
```

### Política 3: Subida de Videos (Admin)
```sql
CREATE POLICY "Admin puede subir videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated'
);
```

## 4. Verificar Configuración

### Verificar Bucket
```sql
SELECT name, public FROM storage.buckets WHERE name = 'videos';
```

### Verificar Políticas
```sql
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
```

## 5. Subir Video de Prueba

1. Sube un video MP4 de prueba a la carpeta `free/`
2. Nómbralo: `entrenamiento-basico-01.mp4`
3. Verifica que se puede acceder desde la app

## Próximos Pasos

1. ✅ Bucket configurado
2. ⏳ Insertar metadatos en tabla `videos`
3. ⏳ Integrar reproductor de video en app
4. ⏳ Implementar control de acceso