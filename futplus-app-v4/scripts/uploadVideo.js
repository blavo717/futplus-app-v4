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
 * Script para subir videos a Supabase Storage
 * 
 * Uso:
 * node scripts/uploadVideo.js <ruta-al-video> [free|premium] [nombre-archivo-opcional]
 * 
 * Ejemplos:
 * node scripts/uploadVideo.js ./videos/entrenamiento.mp4 free
 * node scripts/uploadVideo.js ./videos/tecnica-avanzada.mp4 premium tecnica-avanzada-01.mp4
 */

async function uploadVideo(videoPath, tier = 'free', customFileName = null) {
  try {
    console.log('🎬 Iniciando subida de video a Supabase Storage...\n');

    // Verificar que el archivo existe
    if (!fs.existsSync(videoPath)) {
      throw new Error(`El archivo ${videoPath} no existe`);
    }

    // Verificar que es un archivo de video
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const fileExtension = path.extname(videoPath).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Extensión de archivo no permitida: ${fileExtension}. Permitidas: ${allowedExtensions.join(', ')}`);
    }

    // Obtener información del archivo
    const stats = fs.statSync(videoPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📁 Archivo: ${path.basename(videoPath)}`);
    console.log(`📏 Tamaño: ${fileSizeInMB} MB`);
    console.log(`🏷️  Categoría: ${tier}`);

    // Verificar límite de tamaño (100MB)
    if (stats.size > 100 * 1024 * 1024) {
      throw new Error(`El archivo es demasiado grande (${fileSizeInMB} MB). Máximo permitido: 100 MB`);
    }

    // Generar nombre del archivo
    const originalName = path.basename(videoPath, fileExtension);
    const fileName = customFileName || `${originalName}${fileExtension}`;
    const storagePath = `${tier}/${fileName}`;

    console.log(`📤 Subiendo a: videos/${storagePath}`);

    // Leer el archivo
    const fileBuffer = fs.readFileSync(videoPath);

    // Subir al storage
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(storagePath, fileBuffer, {
        contentType: `video/${fileExtension.slice(1)}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    console.log('✅ Video subido exitosamente!');
    console.log(`📍 Ruta en Storage: ${data.path}`);

    // Generar URL pública (temporal para verificación)
    const { data: urlData } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 60); // 1 minuto

    if (urlData) {
      console.log(`🔗 URL temporal (1 min): ${urlData.signedUrl}`);
    }

    console.log('\n🎉 ¡Subida completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Ejecutar el script SQL para insertar metadatos en la tabla videos');
    console.log('2. Usar la ruta en video_url: ' + storagePath);
    console.log('3. Verificar acceso desde la aplicación');

    return {
      path: storagePath,
      size: stats.size,
      fileName: fileName,
      tier: tier
    };

  } catch (error) {
    console.error('❌ Error subiendo video:', error.message);
    process.exit(1);
  }
}

async function listVideos() {
  try {
    console.log('📋 Videos en Supabase Storage:\n');

    const { data: freeVideos, error: freeError } = await supabase.storage
      .from('videos')
      .list('free');

    const { data: premiumVideos, error: premiumError } = await supabase.storage
      .from('videos')
      .list('premium');

    if (freeError || premiumError) {
      throw freeError || premiumError;
    }

    console.log('🆓 Videos gratuitos:');
    if (freeVideos && freeVideos.length > 0) {
      freeVideos.forEach(video => {
        if (video.name !== '.placeholder') {
          const sizeInMB = (video.metadata?.size / (1024 * 1024)).toFixed(2);
          console.log(`   - ${video.name} (${sizeInMB} MB)`);
        }
      });
    } else {
      console.log('   (sin videos)');
    }

    console.log('\n💎 Videos premium:');
    if (premiumVideos && premiumVideos.length > 0) {
      premiumVideos.forEach(video => {
        if (video.name !== '.placeholder') {
          const sizeInMB = (video.metadata?.size / (1024 * 1024)).toFixed(2);
          console.log(`   - ${video.name} (${sizeInMB} MB)`);
        }
      });
    } else {
      console.log('   (sin videos)');
    }

  } catch (error) {
    console.error('❌ Error listando videos:', error.message);
  }
}

async function deleteVideo(videoPath) {
  try {
    console.log(`🗑️  Eliminando video: ${videoPath}`);

    const { error } = await supabase.storage
      .from('videos')
      .remove([videoPath]);

    if (error) {
      throw error;
    }

    console.log('✅ Video eliminado exitosamente');

  } catch (error) {
    console.error('❌ Error eliminando video:', error.message);
  }
}

// Procesar argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('📖 Uso del script de videos:\n');
    console.log('📤 Subir video:');
    console.log('   node scripts/uploadVideo.js <ruta-video> [free|premium] [nombre-archivo]');
    console.log('   Ejemplo: node scripts/uploadVideo.js ./video.mp4 free entrenamiento-01.mp4\n');
    console.log('📋 Listar videos:');
    console.log('   node scripts/uploadVideo.js --list\n');
    console.log('🗑️  Eliminar video:');
    console.log('   node scripts/uploadVideo.js --delete <ruta-en-storage>');
    console.log('   Ejemplo: node scripts/uploadVideo.js --delete free/video.mp4\n');
    return;
  }

  const command = args[0];

  if (command === '--list') {
    await listVideos();
  } else if (command === '--delete') {
    if (!args[1]) {
      console.error('❌ Especifica la ruta del video a eliminar');
      return;
    }
    await deleteVideo(args[1]);
  } else {
    // Subir video
    const videoPath = args[0];
    const tier = args[1] || 'free';
    const customFileName = args[2] || null;

    if (!['free', 'premium'].includes(tier)) {
      console.error('❌ El segundo parámetro debe ser "free" o "premium"');
      return;
    }

    await uploadVideo(videoPath, tier, customFileName);
  }
}

main().catch(console.error);