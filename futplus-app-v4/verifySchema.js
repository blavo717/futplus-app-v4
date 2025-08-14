const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySchema() {
  console.log('🔍 Verificando esquema actual de la base de datos...\n');

  // Lista de tablas que esperamos encontrar
  const expectedTables = [
    'activities',
    'user_progress',
    'user_achievements',
    'achievements',
    'profiles',
    'video_categories'
  ];

  // Verificar cada tabla
  for (const tableName of expectedTables) {
    try {
      console.log(`📋 Verificando tabla: ${tableName}`);
      
      // Intentar obtener la estructura de la tabla
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log(`  ❌ La tabla ${tableName} no existe (código: ${error.code})`);
        } else if (error.code === 'PGRST204') {
          console.log(`  ⚠️  La tabla ${tableName} existe pero tiene problemas de columna (código: ${error.code})`);
          // Intentar obtener solo una columna para verificar si la tabla existe
          const { data: testData, error: testError } = await supabase
            .from(tableName)
            .select('id')
            .limit(1);
          
          if (testError) {
            console.log(`  ❌ Error al verificar tabla ${tableName}: ${testError.message}`);
          } else {
            console.log(`  ✅ Tabla ${tableName} existe pero necesita revisión de columnas`);
          }
        } else {
          console.log(`  ❌ Error en tabla ${tableName}: ${error.message} (código: ${error.code})`);
        }
      } else {
        console.log(`  ✅ Tabla ${tableName} existe y es accesible`);
        
        // Si es user_achievements, verificar si tiene la columna unlocked
        if (tableName === 'user_achievements') {
          try {
            const { data: achievementData, error: achievementError } = await supabase
              .from('user_achievements')
              .select('unlocked')
              .limit(1);
            
            if (achievementError && achievementError.message.includes('column "unlocked" does not exist')) {
              console.log(`  ⚠️  La tabla user_achievements no tiene la columna 'unlocked'`);
            } else if (achievementError) {
              console.log(`  ❌ Error al verificar columna unlocked: ${achievementError.message}`);
            } else {
              console.log(`  ✅ La tabla user_achievements tiene la columna 'unlocked'`);
            }
          } catch (err) {
            console.log(`  ❌ Error inesperado al verificar columna unlocked: ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.log(`  ❌ Error inesperado con tabla ${tableName}: ${err.message}`);
    }
    console.log(''); // Espacio entre tablas
  }

  // Intentar obtener información de las tablas del sistema
  try {
    console.log('🔍 Intentando obtener información de tablas del sistema...');
    
    // Consulta SQL para obtener tablas del esquema public
    const { data: tablesData, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.log(`  ❌ No se pudo obtener información de tablas: ${tablesError.message}`);
    } else {
      console.log('  📊 Tablas encontradas en el esquema public:');
      if (tablesData && tablesData.length > 0) {
        tablesData.forEach(table => {
          console.log(`    - ${table.tablename}`);
        });
      } else {
        console.log('    No se encontraron tablas en el esquema public');
      }
    }
  } catch (err) {
    console.log(`  ❌ Error al obtener información de tablas: ${err.message}`);
  }
}

verifySchema().catch(console.error);