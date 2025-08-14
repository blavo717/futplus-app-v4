const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  console.error('Verifica que EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY estén configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupStorageBucket() {
  console.log('🚀 Configurando Supabase Storage para videos...\n');

  try {
    // 1. Crear bucket "videos" si no existe
    console.log('📦 Creando bucket "videos"...');
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .createBucket('videos', {
        public: false // Bucket privado para control de acceso
      });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket "videos" ya existe');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Bucket "videos" creado exitosamente');
    }

    // 2. Configurar políticas de acceso
    console.log('\n🔐 Configurando políticas de acceso...');

    // Política para que usuarios autenticados puedan ver videos gratuitos
    const freePolicyQuery = `
      CREATE POLICY "Usuarios pueden ver videos gratuitos" ON storage.objects
      FOR SELECT USING (
        auth.role() = 'authenticated' AND
        bucket_id = 'videos' AND
        (storage.foldername(name))[1] = 'free'
      );
    `;

    // Política para que usuarios premium puedan ver todos los videos
    const premiumPolicyQuery = `
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
    `;

    try {
      // Ejecutar política para videos gratuitos
      const { error: freePolicyError } = await supabase.rpc('exec_sql', {
        sql: freePolicyQuery
      });

      if (freePolicyError && !freePolicyError.message.includes('already exists')) {
        console.log('⚠️  Error creando política de videos gratuitos:', freePolicyError.message);
      } else {
        console.log('✅ Política de videos gratuitos configurada');
      }

      // Ejecutar política para videos premium
      const { error: premiumPolicyError } = await supabase.rpc('exec_sql', {
        sql: premiumPolicyQuery
      });

      if (premiumPolicyError && !premiumPolicyError.message.includes('already exists')) {
        console.log('⚠️  Error creando política de videos premium:', premiumPolicyError.message);
      } else {
        console.log('✅ Política de videos premium configurada');
      }

    } catch (policyError) {
      console.log('⚠️  Las políticas deben configurarse manualmente en el panel de Supabase');
      console.log('📝 SQL para ejecutar en el panel:');
      console.log('\n-- Política para videos gratuitos:');
      console.log(freePolicyQuery);
      console.log('\n-- Política para videos premium:');
      console.log(premiumPolicyQuery);
    }

    // 3. Crear estructura de carpetas
    console.log('\n📁 Creando estructura de carpetas...');
    
    // Crear archivo placeholder para carpeta free
    const { error: freeError } = await supabase
      .storage
      .from('videos')
      .upload('free/.placeholder', new Blob(['placeholder']), {
        cacheControl: '3600',
        upsert: false
      });

    if (freeError && !freeError.message.includes('already exists')) {
      console.log('⚠️  Error creando carpeta free:', freeError.message);
    } else {
      console.log('✅ Carpeta "free" creada');
    }

    // Crear archivo placeholder para carpeta premium
    const { error: premiumError } = await supabase
      .storage
      .from('videos')
      .upload('premium/.placeholder', new Blob(['placeholder']), {
        cacheControl: '3600',
        upsert: false
      });

    if (premiumError && !premiumError.message.includes('already exists')) {
      console.log('⚠️  Error creando carpeta premium:', premiumError.message);
    } else {
      console.log('✅ Carpeta "premium" creada');
    }

    console.log('\n🎉 Configuración de Supabase Storage completada!');
    console.log('\n📋 Estructura final:');
    console.log('   videos/');
    console.log('   ├── free/     (accesible para todos los usuarios)');
    console.log('   └── premium/  (solo para usuarios premium)');

    console.log('\n🔧 Próximos pasos:');
    console.log('1. Verificar políticas en el panel de Supabase');
    console.log('2. Subir videos de prueba usando el script de upload');
    console.log('3. Insertar metadatos en la tabla videos');

  } catch (error) {
    console.error('❌ Error configurando Storage:', error.message);
    process.exit(1);
  }
}

async function listBuckets() {
  console.log('\n📋 Buckets existentes:');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.error('Error obteniendo buckets:', error.message);
  } else {
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
    });
  }
}

// Ejecutar configuración
async function main() {
  await setupStorageBucket();
  await listBuckets();
}

main().catch(console.error);