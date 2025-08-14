const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verificando conexión con Supabase...');
console.log('URL:', supabaseUrl ? '✓ Configurada' : '✗ Falta');
console.log('Key:', supabaseAnonKey ? '✓ Configurada' : '✗ Falta');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Faltan variables de entorno necesarias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Intentar obtener las categorías (tabla pública)
    const { data, error } = await supabase
      .from('video_categories')
      .select('name')
      .limit(1);

    if (error) {
      console.error('\n❌ Error de conexión:', error.message);
    } else {
      console.log('\n✅ Conexión exitosa con Supabase!');
      if (data && data.length > 0) {
        console.log('📊 Datos de prueba obtenidos:', data[0].name);
      }
    }

    // Verificar si la tabla profiles existe
    const { count, error: profileError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profileError) {
      console.log('\n⚠️  Tabla profiles:', profileError.message);
    } else {
      console.log(`✅ Tabla profiles existe (${count || 0} registros)`);
    }

  } catch (err) {
    console.error('\n❌ Error general:', err);
  }
}

testConnection();