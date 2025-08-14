const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase desde variables de entorno
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProblemQueries() {
  console.log('🧪 Probando las consultas que previamente fallaban...\n');
  
  // Test 1: Verificar acceso a tabla activities
  console.log('📋 Test 1: Acceso a tabla activities');
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Tabla activities accesible correctamente');
      console.log(`  📊 Registros encontrados: ${data.length}`);
    }
  } catch (error) {
    console.log('  ❌ Error de conexión:', error.message);
  }
  
  console.log();
  
  // Test 2: Verificar consulta con join específico en user_achievements
  console.log('🔗 Test 2: Join específico user_achievements -> achievements');
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements!user_achievements_achievement_id_fkey (*)
      `)
      .limit(1);
      
    if (error) {
      console.log('  ❌ Error:', error.message);
    } else {
      console.log('  ✅ Join específico funciona correctamente');
      console.log(`  📊 Registros encontrados: ${data.length}`);
    }
  } catch (error) {
    console.log('  ❌ Error de conexión:', error.message);
  }
  
  console.log();
  
  // Test 3: Verificar consulta sin especificar foreign key (para comparar)
  console.log('🔗 Test 3: Join genérico user_achievements -> achievements (para comparar)');
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (*)
      `)
      .limit(1);
      
    if (error) {
      console.log('  ❌ Error (esperado si hay ambigüedad):', error.message);
    } else {
      console.log('  ✅ Join genérico también funciona');
      console.log(`  📊 Registros encontrados: ${data.length}`);
    }
  } catch (error) {
    console.log('  ❌ Error de conexión:', error.message);
  }
  
  console.log();
  
  // Test 4: Insertar un registro de prueba en activities (para verificar escritura)
  console.log('✏️ Test 4: Inserción en tabla activities');
  try {
    const testActivity = {
      user_id: '00000000-0000-0000-0000-000000000000', // UUID temporal para prueba
      title: 'Test Activity',
      description: 'Actividad de prueba para verificar funcionalidad',
      type: 'training',
      scheduled_time: new Date().toISOString(),
      completed: false
    };
    
    const { data, error } = await supabase
      .from('activities')
      .insert(testActivity)
      .select()
      .single();
      
    if (error) {
      console.log('  ❌ Error en inserción:', error.message);
    } else {
      console.log('  ✅ Inserción exitosa en tabla activities');
      console.log(`  📝 ID generado: ${data.id}`);
      
      // Limpiar el registro de prueba
      await supabase.from('activities').delete().eq('id', data.id);
      console.log('  🧹 Registro de prueba eliminado');
    }
  } catch (error) {
    console.log('  ❌ Error de conexión:', error.message);
  }
  
  console.log('\n🎯 Pruebas completadas!');
}

// Ejecutar las pruebas
testProblemQueries().catch(console.error);