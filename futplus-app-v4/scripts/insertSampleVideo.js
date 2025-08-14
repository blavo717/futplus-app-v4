const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertSampleVideo() {
  console.log('🎬 Insertando video de muestra en la base de datos...\n');

  try {
    // 1. Primero insertar/verificar categoría de video
    console.log('📂 Verificando categoría "Técnica"...');
    
    let { data: categoryData, error: categorySelectError } = await supabase
      .from('video_categories')
      .select('id')
      .eq('slug', 'tecnica')
      .single();

    let categoryId;

    if (categorySelectError && categorySelectError.code === 'PGRST116') {
      // La categoría no existe, crearla
      console.log('📂 Creando categoría "Técnica"...');
      const { data: newCategory, error: categoryInsertError } = await supabase
        .from('video_categories')
        .insert({
          name: 'Técnica',
          slug: 'tecnica',
          description: 'Videos enfocados en mejorar la técnica individual',
          icon: 'football',
          order_index: 1
        })
        .select()
        .single();

      if (categoryInsertError) {
        throw categoryInsertError;
      }
      
      categoryId = newCategory.id;
      console.log('✅ Categoría "Técnica" creada con ID:', categoryId);
    } else if (categorySelectError) {
      throw categorySelectError;
    } else {
      categoryId = categoryData.id;
      console.log('✅ Categoría "Técnica" encontrada con ID:', categoryId);
    }

    // 2. Insertar video de muestra
    console.log('\n🎥 Insertando video "Entrenamiento Básico de Fútbol"...');
    
    const videoData = {
      title: 'Entrenamiento Básico de Fútbol',
      description: 'Aprende las técnicas fundamentales del fútbol con este entrenamiento básico. Perfecto para principiantes que quieren mejorar su control de balón, pases y tiro.',
      video_url: 'videos/free/entrenamiento-basico-01.mp4', // Ruta en Supabase Storage
      thumbnail_url: null, // Se puede agregar después
      duration: 1800, // 30 minutos en segundos
      category: 'technique', // Enum value
      category_id: categoryId,
      level: 'beginner', // Enum value
      position: ['midfielder', 'forward'], // Array de posiciones
      is_premium: false, // Video gratuito
      tags: ['básico', 'técnica', 'principiantes', 'control', 'pases'],
      view_count: 0,
      order_index: 1
    };

    const { data: videoResult, error: videoError } = await supabase
      .from('videos')
      .insert(videoData)
      .select()
      .single();

    if (videoError) {
      throw videoError;
    }

    console.log('✅ Video insertado exitosamente!');
    console.log('📄 Detalles del video:');
    console.log(`   ID: ${videoResult.id}`);
    console.log(`   Título: ${videoResult.title}`);
    console.log(`   Duración: ${videoResult.duration} segundos`);
    console.log(`   Categoría: ${videoResult.category}`);
    console.log(`   Nivel: ${videoResult.level}`);
    console.log(`   Premium: ${videoResult.is_premium ? 'Sí' : 'No'}`);
    console.log(`   URL: ${videoResult.video_url}`);

    // 3. Verificar la inserción
    console.log('\n🔍 Verificando videos en la base de datos...');
    const { data: allVideos, error: selectError } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        duration,
        category,
        level,
        is_premium,
        video_categories (
          name,
          slug
        )
      `)
      .order('created_at', { ascending: true });

    if (selectError) {
      throw selectError;
    }

    console.log(`📊 Total de videos en BD: ${allVideos.length}`);
    allVideos.forEach((video, index) => {
      console.log(`   ${index + 1}. ${video.title} (${video.level}, ${video.is_premium ? 'Premium' : 'Gratuito'})`);
    });

    console.log('\n🎉 ¡Video de muestra insertado correctamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Configurar Supabase Storage siguiendo docs/supabase-storage-setup.md');
    console.log('2. Subir el archivo entrenamiento-basico-01.mp4 a videos/free/');
    console.log('3. Integrar reproductor de video en la app');
    console.log('4. Probar acceso desde EntrenamientoScreen');

  } catch (error) {
    console.error('❌ Error insertando video:', error.message);
    if (error.details) {
      console.error('Detalles:', error.details);
    }
    if (error.hint) {
      console.error('Sugerencia:', error.hint);
    }
    process.exit(1);
  }
}

// Función para limpiar videos de prueba (opcional)
async function clearSampleVideos() {
  console.log('🗑️  Limpiando videos de muestra...');
  
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('title', 'Entrenamiento Básico de Fútbol');

  if (error) {
    console.error('Error limpiando videos:', error.message);
  } else {
    console.log('✅ Videos de muestra eliminados');
  }
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--clear')) {
  clearSampleVideos().catch(console.error);
} else {
  insertSampleVideo().catch(console.error);
}