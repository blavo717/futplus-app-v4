# Proceso Completo de Subida de Videos en FutPlus

## Resumen del Sistema

El sistema de videos de FutPlus está integrado completamente con Supabase Storage y la base de datos, permitiendo:

- ✅ **Control de acceso** (free vs premium)
- ✅ **Reproductor nativo** con expo-av
- ✅ **Gestión completa de metadatos**
- ✅ **Scripts automatizados** para subida y gestión

## Arquitectura del Sistema

```
📁 Estructura de almacenamiento:
videos/
├── free/     # Videos accesibles para usuarios gratuitos
└── premium/  # Videos solo para usuarios premium

📊 Base de datos:
- videos (metadatos de videos)
- video_categories (categorías organizacionales)
- user_video_progress (progreso de visualización)
```

## Proceso Paso a Paso

### 1. Configurar Supabase Storage (Solo primera vez)

```bash
# Ejecutar configuración inicial
node scripts/setupSupabaseStorage.js
```

O seguir la guía manual en [`docs/supabase-storage-setup.md`](./supabase-storage-setup.md)

### 2. Subir Archivo de Video

```bash
# Subir video gratuito
node scripts/uploadVideo.js ./path/to/video.mp4 free nombre-personalizado.mp4

# Subir video premium
node scripts/uploadVideo.js ./path/to/video.mp4 premium video-avanzado.mp4

# Listar videos subidos
node scripts/uploadVideo.js --list

# Eliminar video del storage
node scripts/uploadVideo.js --delete free/video-obsoleto.mp4
```

### 3. Agregar Metadatos a la Base de Datos

```bash
# Método 1: Script interactivo
node scripts/manageVideoMetadata.js add \
  --title "Entrenamiento Básico de Fútbol" \
  --video_url "videos/free/entrenamiento-basico-01.mp4" \
  --duration 1800 \
  --category "technique" \
  --level "beginner" \
  --description "Aprende las técnicas fundamentales del fútbol" \
  --category_name "Técnica" \
  --positions "midfielder,forward" \
  --tags "básico,técnica,control,pases" \
  --is_premium false \
  --order_index 1

# Método 2: SQL directo (ejecutar en Supabase Dashboard)
# Ver archivo scripts/insertSampleVideo.sql
```

### 4. Verificar Integración

```bash
# Listar todos los videos en BD
node scripts/manageVideoMetadata.js list

# Verificar acceso desde la app
# Los videos aparecerán automáticamente en EntrenamientoScreen
```

## Scripts Disponibles

### 📤 `scripts/uploadVideo.js`
Gestiona archivos de video en Supabase Storage.

**Comandos:**
- `node scripts/uploadVideo.js <archivo> [free|premium] [nombre]` - Subir video
- `node scripts/uploadVideo.js --list` - Listar videos
- `node scripts/uploadVideo.js --delete <ruta>` - Eliminar video

### 📝 `scripts/manageVideoMetadata.js`
Gestiona metadatos de videos en la base de datos.

**Comandos:**
- `add` - Agregar nuevo video con metadatos
- `list` - Listar todos los videos
- `update <id> --campo valor` - Actualizar metadatos
- `delete <id>` - Eliminar metadatos

### 🛠️ `scripts/setupSupabaseStorage.js`
Configuración inicial del bucket y políticas de acceso.

### 📊 `scripts/insertSampleVideo.sql`
SQL para insertar videos de prueba directamente.

## Configuración de Categorías

Las categorías disponibles son:

- **technique** (Técnica) - Habilidades individuales
- **physical** (Físico) - Preparación física
- **tactical** (Táctico) - Estrategia y posicionamiento
- **mental** (Mental) - Aspectos psicológicos
- **nutrition** (Nutrición) - Alimentación deportiva

## Niveles de Dificultad

- **beginner** (Principiante)
- **intermediate** (Intermedio)
- **advanced** (Avanzado)

## Posiciones de Jugador

- **goalkeeper** (Portero)
- **defender** (Defensa)
- **midfielder** (Centrocampista)
- **forward** (Delantero)

## Control de Acceso

### Usuarios Gratuitos
- ✅ Acceso a videos en `videos/free/`
- ❌ Bloqueados videos premium
- ✅ Visualización de información básica

### Usuarios Premium
- ✅ Acceso a todos los videos
- ✅ Videos exclusivos en `videos/premium/`
- ✅ Funciones avanzadas del reproductor

## Reproductor de Video

El reproductor integrado (`VideoPlayer.tsx`) incluye:

- ✅ **Controles nativos** (play/pause, progreso, tiempo)
- ✅ **Control de acceso automático**
- ✅ **Seguimiento de progreso** en base de datos
- ✅ **Interfaz responsive** para móviles
- ✅ **Gestión de URLs firmadas** para seguridad

## Resolución de Problemas

### Video no se reproduce
1. Verificar que el archivo existe en Storage
2. Comprobar políticas RLS en Supabase
3. Verificar formato de video (MP4 recomendado)
4. Revisar logs de la consola para errores

### Video no aparece en la app
1. Verificar metadatos en tabla `videos`
2. Comprobar `is_premium` vs tipo de usuario
3. Verificar `category` y filtros activos
4. Recargar datos con botón "Recargar Videos"

### Error de permisos
1. Verificar configuración de bucket como privado
2. Revisar políticas RLS en `storage.objects`
3. Confirmar que usuario está autenticado

## Ejemplo Completo

```bash
# 1. Subir video
node scripts/uploadVideo.js ./videos/tecnica-basica.mp4 free tecnica-basica-01.mp4

# 2. Agregar metadatos
node scripts/manageVideoMetadata.js add \
  --title "Técnica Básica de Control" \
  --video_url "videos/free/tecnica-basica-01.mp4" \
  --duration 900 \
  --category "technique" \
  --level "beginner" \
  --description "Aprende el control básico del balón" \
  --category_name "Técnica" \
  --positions "midfielder,forward" \
  --tags "control,básico,técnica" \
  --is_premium false \
  --order_index 2

# 3. Verificar
node scripts/manageVideoMetadata.js list
```

## Mantenimiento

### Backup Regular
- Exportar metadatos: `node scripts/manageVideoMetadata.js list > backup-videos.txt`
- Respaldar archivos de Storage manualmente desde Dashboard

### Optimización
- Comprimir videos antes de subir (máx. 100MB)
- Usar resolución apropiada para móviles (720p recomendado)
- Generar thumbnails personalizados si es necesario

### Monitoreo
- Revisar logs de acceso en Supabase Dashboard
- Monitorear uso de ancho de banda
- Verificar reproducciones y progreso de usuarios

---

## Estado del Sistema ✅

- [x] Supabase Storage configurado
- [x] Políticas de acceso implementadas  
- [x] Base de datos preparada
- [x] Scripts de gestión creados
- [x] Reproductor integrado
- [x] Control de acceso funcionando
- [x] EntrenamientoScreen actualizado
- [x] Documentación completa

**¡El sistema de videos está 100% operativo!**