const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Script para gestionar metadatos de videos en la base de datos
 * 
 * Uso:
 * node scripts/manageVideoMetadata.js <comando> [opciones]
 * 
 * Comandos:
 * - add: Agregar nuevo video con metadatos
 * - list: Listar todos los videos
 * - update: Actualizar metadatos de un video
 * - delete: Eliminar un video (solo metadatos)
 */

async function addVideoMetadata(options) {
  try {
    console.log('📝 Agregando metadatos de video...\n');

    // Validar datos requeridos
    const requiredFields = ['title', 'video_url', 'duration', 'category', 'level'];
    for (const field of requiredFields) {
      if (!options[field]) {
        throw new Error(`Campo requerido faltante: ${field}`);
      }
    }

    // Obtener o crear categoría
    let categoryId = null;
    if (options.category_name) {
      const { data: categoryData, error: categoryError } = await supabase
        .from('video_categories')
        .select('id')
        .eq('name', options.category_name)
        .single();

      if (categoryError && categoryError.code === 'PGRST116') {
        // Crear nueva categoría
        const { data: newCategory, error: newCategoryError } = await supabase
          .from('video_categories')
          .insert({
            name: options.category_name,
            slug: options.category_name.toLowerCase().replace(/\s+/g, '-'),
            description: options.category_description || null,
            icon: options.category_icon || 'play',
            order_index: options.category_order || 999
          })
          .select()
          .single();

        if (newCategoryError) {
          throw newCategoryError;
        }

        categoryId = newCategory.id;
        console.log(`✅ Nueva categoría creada: ${options.category_name}`);
      } else if (categoryError) {
        throw categoryError;
      } else {
        categoryId = categoryData.id;
        console.log(`✅ Categoría encontrada: ${options.category_name}`);
      }
    }

    // Preparar datos del video
    const videoData = {
      title: options.title,
      description: options.description || null,
      video_url: options.video_url,
      duration: parseInt(options.duration),
      category: options.category,
      category_id: categoryId,
      level: options.level,
      position: options.positions ? options.positions.split(',') : null,
      is_premium: options.is_premium === 'true',
      tags: options.tags ? options.tags.split(',') : null,
      view_count: 0,
      order_index: parseInt(options.order_index || '999')
    };

    // Insertar video
    const { data: videoResult, error: videoError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (videoError) {
      throw videoError;
    }

    console.log('✅ Video agregado exitosamente!');
    console.log('📄 Detalles:');
    console.log(`   ID: ${videoResult.id}`);
    console.log(`   Título: ${videoResult.title}`);
    console.log(`   URL: ${videoResult.video_url}`);
    console.log(`   Duración: ${videoResult.duration} segundos`);
    console.log(`   Categoría: ${videoResult.category}`);
    console.log(`   Nivel: ${videoResult.level}`);
    console.log(`   Premium: ${videoResult.is_premium ? 'Sí' : 'No'}`);

    return videoResult;

  } catch (error) {
    console.error('❌ Error agregando video:', error.message);
    if (error.details) console.error('Detalles:', error.details);
    process.exit(1);
  }
}

async function listVideos() {
  try {
    console.log('📋 Listando videos en la base de datos...\n');

    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        video_url,
        duration,
        category,
        level,
        is_premium,
        view_count,
        order_index,
        video_categories (
          name,
          slug
        )
      `)
      .order('order_index', { ascending: true });

    if (error) {
      throw error;
    }

    if (!videos || videos.length === 0) {
      console.log('📭 No hay videos en la base de datos');
      return;
    }

    console.log(`📊 Total de videos: ${videos.length}\n`);

    videos.forEach((video, index) => {
      const duration = Math.floor(video.duration / 60);
      const categoryName = video.video_categories?.name || video.category;
      const premium = video.is_premium ? '💎' : '🆓';
      
      console.log(`${index + 1}. ${premium} ${video.title}`);
      console.log(`   🎥 ${video.video_url}`);
      console.log(`   ⏱️  ${duration} min | 📊 ${video.level} | 🏷️  ${categoryName}`);
      console.log(`   👀 ${video.view_count} visualizaciones | 📋 Orden: ${video.order_index}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listando videos:', error.message);
  }
}

async function updateVideoMetadata(videoId, updates) {
  try {
    console.log(`📝 Actualizando video ID: ${videoId}...\n`);

    // Preparar datos de actualización
    const updateData = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.duration) updateData.duration = parseInt(updates.duration);
    if (updates.category) updateData.category = updates.category;
    if (updates.level) updateData.level = updates.level;
    if (updates.is_premium) updateData.is_premium = updates.is_premium === 'true';
    if (updates.positions) updateData.position = updates.positions.split(',');
    if (updates.tags) updateData.tags = updates.tags.split(',');
    if (updates.order_index) updateData.order_index = parseInt(updates.order_index);

    const { data: result, error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', videoId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Video actualizado exitosamente!');
    console.log('📄 Nuevos datos:');
    console.log(`   Título: ${result.title}`);
    console.log(`   Duración: ${result.duration} segundos`);
    console.log(`   Categoría: ${result.category}`);
    console.log(`   Nivel: ${result.level}`);
    console.log(`   Premium: ${result.is_premium ? 'Sí' : 'No'}`);

    return result;

  } catch (error) {
    console.error('❌ Error actualizando video:', error.message);
    process.exit(1);
  }
}

async function deleteVideoMetadata(videoId) {
  try {
    console.log(`🗑️  Eliminando metadatos del video ID: ${videoId}...\n`);

    // Obtener datos del video antes de eliminar
    const { data: video, error: getError } = await supabase
      .from('videos')
      .select('title, video_url')
      .eq('id', videoId)
      .single();

    if (getError) {
      throw getError;
    }

    // Eliminar video
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ Metadatos eliminados exitosamente!');
    console.log(`📄 Video eliminado: ${video.title}`);
    console.log(`🎥 URL del archivo: ${video.video_url}`);
    console.log('\n⚠️  Nota: Solo se eliminaron los metadatos.');
    console.log('   El archivo de video en Storage debe eliminarse manualmente si es necesario.');

  } catch (error) {
    console.error('❌ Error eliminando video:', error.message);
    process.exit(1);
  }
}

function printUsage() {
  console.log('📖 Uso del script de gestión de metadatos:\n');
  
  console.log('📝 Agregar video:');
  console.log('   node scripts/manageVideoMetadata.js add \\');
  console.log('     --title "Título del video" \\');
  console.log('     --video_url "videos/free/archivo.mp4" \\');
  console.log('     --duration 1800 \\');
  console.log('     --category "technique" \\');
  console.log('     --level "beginner" \\');
  console.log('     --description "Descripción opcional" \\');
  console.log('     --category_name "Técnica" \\');
  console.log('     --positions "midfielder,forward" \\');
  console.log('     --tags "básico,técnica,control" \\');
  console.log('     --is_premium false \\');
  console.log('     --order_index 1\n');
  
  console.log('📋 Listar videos:');
  console.log('   node scripts/manageVideoMetadata.js list\n');
  
  console.log('📝 Actualizar video:');
  console.log('   node scripts/manageVideoMetadata.js update <video-id> \\');
  console.log('     --title "Nuevo título" \\');
  console.log('     --level "intermediate"\n');
  
  console.log('🗑️  Eliminar metadatos:');
  console.log('   node scripts/manageVideoMetadata.js delete <video-id>\n');
}

// Procesar argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    return;
  }

  const command = args[0];

  // Parsear argumentos con formato --key value
  const options = {};
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1];
      options[key] = value;
      i++; // Saltar el valor
    }
  }

  try {
    switch (command) {
      case 'add':
        await addVideoMetadata(options);
        break;
      
      case 'list':
        await listVideos();
        break;
      
      case 'update':
        const updateId = args[1];
        if (!updateId) {
          console.error('❌ Especifica el ID del video a actualizar');
          return;
        }
        await updateVideoMetadata(updateId, options);
        break;
      
      case 'delete':
        const deleteId = args[1];
        if (!deleteId) {
          console.error('❌ Especifica el ID del video a eliminar');
          return;
        }
        await deleteVideoMetadata(deleteId);
        break;
      
      default:
        console.error(`❌ Comando desconocido: ${command}`);
        printUsage();
    }
  } catch (error) {
    console.error('❌ Error ejecutando comando:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);