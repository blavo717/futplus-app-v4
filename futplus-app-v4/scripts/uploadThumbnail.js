const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('Verifica que EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY estén configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script para subir thumbnails de videos a Supabase Storage y actualizar la base de datos
 * 
 * Uso:
 * node scripts/uploadThumbnail.js <ruta-imagen> <video-tier> <video-filename>
 * 
 * Ejemplos:
 * node scripts/uploadThumbnail.js ./images/thumbnail.png free abductor-elevacion-cadera
 * node scripts/uploadThumbnail.js ./images/premium-thumb.jpg premium skipping-alterno-elevacion-cadera
 */

/**
 * Sube un thumbnail y actualiza automáticamente la base de datos
 */
async function uploadThumbnail(imagePath, tier = 'free', videoFilename) {
  try {
    console.log('🖼️  Iniciando subida de thumbnail a Supabase Storage...\n');

    // Verificar que el archivo existe
    if (!fs.existsSync(imagePath)) {
      throw new Error(`El archivo ${imagePath} no existe`);
    }

    // Verificar que es un archivo de imagen
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const fileExtension = path.extname(imagePath).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Extensión de archivo no permitida: ${fileExtension}. Permitidas: ${allowedExtensions.join(', ')}`);
    }

    // Validar tier
    if (!['free', 'premium'].includes(tier)) {
      throw new Error(`Tier no válido: ${tier}. Debe ser 'free' o 'premium'`);
    }

    // Obtener información del archivo
    const stats = fs.statSync(imagePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📁 Archivo: ${path.basename(imagePath)}`);
    console.log(`📏 Tamaño: ${fileSizeInMB} MB`);
    console.log(`🏷️  Categoría: ${tier}`);
    console.log(`🎬 Video: ${videoFilename}`);

    // Verificar límite de tamaño (10MB para imágenes)
    if (stats.size > 10 * 1024 * 1024) {
      throw new Error(`El archivo es demasiado grande (${fileSizeInMB} MB). Máximo permitido: 10 MB`);
    }

    // Generar nombre del thumbnail
    const thumbnailName = `${videoFilename}-thumb${fileExtension}`;
    const storagePath = `${tier}/thumbnails/${thumbnailName}`;

    console.log(`📤 Subiendo a: videos/${storagePath}`);

    // Leer el archivo
    const fileBuffer = fs.readFileSync(imagePath);

    // Verificar que el video existe en la base de datos
    console.log('🔍 Verificando que el video existe en la base de datos...');
    const videoPath = `${tier}/${videoFilename}.mp4`;
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('id, title, video_url')
      .eq('video_url', videoPath)
      .single();

    if (videoError || !videoData) {
      throw new Error(`No se encontró un video con la ruta: ${videoPath}. Asegúrate de que el video existe en la base de datos.`);
    }

    console.log(`✅ Video encontrado: "${videoData.title}" (ID: ${videoData.id})`);

    // Subir al storage
    console.log('📤 Subiendo thumbnail al Storage...');
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(storagePath, fileBuffer, {
        contentType: `image/${fileExtension.slice(1) === 'jpg' ? 'jpeg' : fileExtension.slice(1)}`,
        cacheControl: '3600',
        upsert: true // Permitir sobrescribir si ya existe
      });

    if (error) {
      throw error;
    }

    console.log('✅ Thumbnail subido exitosamente!');
    console.log(`📍 Ruta en Storage: ${data.path}`);

    // Actualizar la base de datos con la URL del thumbnail
    console.log('💾 Actualizando base de datos...');
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        thumbnail_url: storagePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoData.id);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Base de datos actualizada exitosamente!');

    // Generar URL pública (temporal para verificación)
    const { data: urlData } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 300); // 5 minutos

    if (urlData) {
      console.log(`🔗 URL temporal (5 min): ${urlData.signedUrl}`);
    }

    console.log('\n🎉 ¡Proceso completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`• Thumbnail subido: ${storagePath}`);
    console.log(`• Video actualizado: ${videoData.title}`);
    console.log(`• Campo thumbnail_url actualizado en la base de datos`);

    return {
      path: storagePath,
      size: stats.size,
      fileName: thumbnailName,
      tier: tier,
      videoId: videoData.id,
      videoTitle: videoData.title
    };

  } catch (error) {
    console.error('❌ Error subiendo thumbnail:', error.message);
    process.exit(1);
  }
}

/**
 * Lista todos los thumbnails existentes
 */
async function listThumbnails() {
  try {
    console.log('📋 Thumbnails en Supabase Storage:\n');

    const { data: freeThumbnails, error: freeError } = await supabase.storage
      .from('videos')
      .list('free/thumbnails');

    const { data: premiumThumbnails, error: premiumError } = await supabase.storage
      .from('videos')
      .list('premium/thumbnails');

    if (freeError && freeError.message !== 'The resource was not found') {
      throw freeError;
    }

    if (premiumError && premiumError.message !== 'The resource was not found') {
      throw premiumError;
    }

    console.log('🆓 Thumbnails gratuitos:');
    if (freeThumbnails && freeThumbnails.length > 0) {
      freeThumbnails.forEach(thumbnail => {
        if (thumbnail.name !== '.placeholder') {
          const sizeInKB = (thumbnail.metadata?.size / 1024).toFixed(1);
          console.log(`   - ${thumbnail.name} (${sizeInKB} KB)`);
        }
      });
    } else {
      console.log('   (sin thumbnails)');
    }

    console.log('\n💎 Thumbnails premium:');
    if (premiumThumbnails && premiumThumbnails.length > 0) {
      premiumThumbnails.forEach(thumbnail => {
        if (thumbnail.name !== '.placeholder') {
          const sizeInKB = (thumbnail.metadata?.size / 1024).toFixed(1);
          console.log(`   - ${thumbnail.name} (${sizeInKB} KB)`);
        }
      });
    } else {
      console.log('   (sin thumbnails)');
    }

    // Mostrar también videos sin thumbnails
    console.log('\n🔍 Verificando videos sin thumbnails...');
    const { data: videosWithoutThumbnails, error: videosError } = await supabase
      .from('videos')
      .select('id, title, video_url, is_premium')
      .is('thumbnail_url', null);

    if (videosError) {
      console.error('Error obteniendo videos sin thumbnails:', videosError);
    } else if (videosWithoutThumbnails && videosWithoutThumbnails.length > 0) {
      console.log('\n⚠️  Videos sin thumbnails:');
      videosWithoutThumbnails.forEach(video => {
        const tier = video.is_premium ? 'premium' : 'free';
        const videoFilename = path.basename(video.video_url, '.mp4');
        console.log(`   - ${video.title} (${tier}/${videoFilename})`);
      });
    } else {
      console.log('\n✅ Todos los videos tienen thumbnails asignados');
    }

  } catch (error) {
    console.error('❌ Error listando thumbnails:', error.message);
  }
}

/**
 * Elimina un thumbnail del storage y actualiza la base de datos
 */
async function deleteThumbnail(thumbnailPath) {
  try {
    console.log(`🗑️  Eliminando thumbnail: ${thumbnailPath}`);

    // Buscar el video que usa este thumbnail
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('id, title')
      .eq('thumbnail_url', thumbnailPath)
      .single();

    if (videoError && videoError.code !== 'PGRST116') {
      throw videoError;
    }

    // Eliminar del storage
    const { error: storageError } = await supabase.storage
      .from('videos')
      .remove([thumbnailPath]);

    if (storageError) {
      throw storageError;
    }

    console.log('✅ Thumbnail eliminado del storage');

    // Actualizar la base de datos si había un video usando este thumbnail
    if (videoData) {
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          thumbnail_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoData.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Video "${videoData.title}" actualizado (thumbnail_url = null)`);
    }

    console.log('✅ Proceso completado exitosamente');

  } catch (error) {
    console.error('❌ Error eliminando thumbnail:', error.message);
  }
}

/**
 * Actualiza manualmente el thumbnail_url de un video
 */
async function updateVideoThumbnail(videoId, thumbnailPath) {
  try {
    console.log(`🔄 Actualizando thumbnail del video ${videoId}...`);

    // Verificar que el video existe
    const { data: videoData, error: videoError } = await supabase
      .from('videos')
      .select('id, title, video_url')
      .eq('id', videoId)
      .single();

    if (videoError || !videoData) {
      throw new Error(`No se encontró un video con ID: ${videoId}`);
    }

    // Verificar que el thumbnail existe en el storage si se proporciona una ruta
    if (thumbnailPath) {
      const { data: fileData, error: fileError } = await supabase.storage
        .from('videos')
        .list(path.dirname(thumbnailPath), {
          search: path.basename(thumbnailPath)
        });

      if (fileError || !fileData || fileData.length === 0) {
        throw new Error(`No se encontró el thumbnail en el storage: ${thumbnailPath}`);
      }
    }

    // Actualizar la base de datos
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        thumbnail_url: thumbnailPath,
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ Video "${videoData.title}" actualizado`);
    console.log(`📍 Nuevo thumbnail: ${thumbnailPath || 'null'}`);

  } catch (error) {
    console.error('❌ Error actualizando thumbnail del video:', error.message);
  }
}

// Procesar argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📖 Uso del script de thumbnails:\n');
    console.log('📤 Subir thumbnail:');
    console.log('   node scripts/uploadThumbnail.js <ruta-imagen> <video-tier> <video-filename>');
    console.log('   Ejemplo: node scripts/uploadThumbnail.js ./thumb.png free abductor-elevacion-cadera\n');
    console.log('📋 Listar thumbnails:');
    console.log('   node scripts/uploadThumbnail.js --list\n');
    console.log('🗑️  Eliminar thumbnail:');
    console.log('   node scripts/uploadThumbnail.js --delete <ruta-en-storage>');
    console.log('   Ejemplo: node scripts/uploadThumbnail.js --delete free/thumbnails/video-thumb.png\n');
    console.log('🔄 Actualizar thumbnail de video:');
    console.log('   node scripts/uploadThumbnail.js --update <video-id> <thumbnail-path>');
    console.log('   Ejemplo: node scripts/uploadThumbnail.js --update abc123 free/thumbnails/nuevo-thumb.png\n');
    console.log('📋 Estructura de carpetas objetivo:');
    console.log('   videos/');
    console.log('   ├── free/');
    console.log('   │   ├── video.mp4');
    console.log('   │   └── thumbnails/');
    console.log('   │       └── video-thumb.png');
    console.log('   └── premium/');
    console.log('       ├── video.mp4');
    console.log('       └── thumbnails/');
    console.log('           └── video-thumb.png');
    return;
  }

  const command = args[0];

  if (command === '--list') {
    await listThumbnails();
  } else if (command === '--delete') {
    if (!args[1]) {
      console.error('❌ Especifica la ruta del thumbnail a eliminar');
      return;
    }
    await deleteThumbnail(args[1]);
  } else if (command === '--update') {
    if (!args[1] || !args[2]) {
      console.error('❌ Especifica el ID del video y la ruta del thumbnail');
      return;
    }
    await updateVideoThumbnail(args[1], args[2]);
  } else {
    // Subir thumbnail
    const imagePath = args[0];
    const tier = args[1];
    const videoFilename = args[2];

    if (!imagePath || !tier || !videoFilename) {
      console.error('❌ Faltan parámetros requeridos');
      console.error('Uso: node scripts/uploadThumbnail.js <ruta-imagen> <video-tier> <video-filename>');
      return;
    }

    if (!['free', 'premium'].includes(tier)) {
      console.error('❌ El tier debe ser "free" o "premium"');
      return;
    }

    await uploadThumbnail(imagePath, tier, videoFilename);
  }
}

main().catch(console.error);