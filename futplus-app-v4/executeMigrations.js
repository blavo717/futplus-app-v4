const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function executeMigrations() {
  console.log('🚀 Ejecutando migraciones de la base de datos...\n');

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'database_fixes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Dividir el SQL en sentencias individuales
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Se encontraron ${statements.length} sentencias SQL para ejecutar\n`);

    // Ejecutar cada sentencia
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Saltar comentarios
      if (statement.trim().startsWith('--') || statement.trim().startsWith('/*')) {
        continue;
      }

      console.log(`⚡ Ejecutando sentencia ${i + 1}/${statements.length}...`);
      
      try {
        // Usar RPC para ejecutar SQL crudo
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // Si el RPC no existe, intentar con el método alternativo
          if (error.message.includes('function exec_sql does not exist')) {
            console.log('⚠️  La función exec_sql no existe, intentando método alternativo...');
            
            // Para sentencias CREATE, ALTER, etc., necesitamos usar el cliente directamente
            // pero esto puede no funcionar con el cliente anon. Vamos a intentar ejecutar
            // las sentencias más importantes individualmente
            await executeStatementWithAlternativeMethod(statement);
          } else {
            console.log(`❌ Error en sentencia ${i + 1}: ${error.message}`);
          }
        } else {
          console.log(`✅ Sentencia ${i + 1} ejecutada correctamente`);
        }
      } catch (err) {
        console.log(`❌ Error al ejecutar sentencia ${i + 1}: ${err.message}`);
      }
    }

    console.log('\n🎉 Migraciones completadas');
    
    // Verificar los cambios
    await verifyChanges();

  } catch (error) {
    console.error('❌ Error general al ejecutar migraciones:', error);
  }
}

async function executeStatementWithAlternativeMethod(statement) {
  const trimmedStatement = statement.trim().toUpperCase();
  
  // Intentar ejecutar operaciones específicas basadas en el tipo de sentencia
  if (trimmedStatement.startsWith('CREATE TABLE')) {
    console.log('📋 Creando tabla...');
    // No podemos ejecutar CREATE TABLE directamente con el cliente anon
    // Necesitaríamos usar el service role key
    console.log('⚠️  No se puede ejecutar CREATE TABLE con cliente anónimo. Se necesitan permisos de administrador.');
  } else if (trimmedStatement.startsWith('ALTER TABLE')) {
    console.log('📋 Modificando tabla...');
    console.log('⚠️  No se puede ejecutar ALTER TABLE con cliente anónimo. Se necesitan permisos de administrador.');
  } else if (trimmedStatement.startsWith('CREATE INDEX')) {
    console.log('📋 Creando índice...');
    console.log('⚠️  No se puede ejecutar CREATE INDEX con cliente anónimo. Se necesitan permisos de administrador.');
  } else if (trimmedStatement.startsWith('CREATE POLICY')) {
    console.log('📋 Creando política RLS...');
    console.log('⚠️  No se puede ejecutar CREATE POLICY con cliente anónimo. Se necesitan permisos de administrador.');
  } else if (trimmedStatement.startsWith('INSERT INTO')) {
    console.log('📋 Insertando datos...');
    console.log('⚠️  No se puede ejecutar INSERT INTO con cliente anónimo para tablas del sistema. Se necesitan permisos de administrador.');
  } else {
    console.log(`📋 Ejecutando: ${trimmedStatement.substring(0, 50)}...`);
    console.log('⚠️  Esta operación requiere permisos de administrador.');
  }
}

async function verifyChanges() {
  console.log('\n🔍 Verificando los cambios realizados...\n');

  // Verificar tabla user_progress
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ La tabla user_progress aún no existe o no es accesible');
    } else {
      console.log('✅ Tabla user_progress existe y es accesible');
    }
  } catch (err) {
    console.log('❌ Error al verificar user_progress:', err.message);
  }

  // Verificar columna unlocked en user_achievements
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('unlocked')
      .limit(1);

    if (error && error.message.includes('column "unlocked" does not exist')) {
      console.log('❌ La columna unlocked aún no existe en user_achievements');
    } else if (error) {
      console.log('❌ Error al verificar columna unlocked:', error.message);
    } else {
      console.log('✅ Columna unlocked existe en user_achievements');
    }
  } catch (err) {
    console.log('❌ Error al verificar columna unlocked:', err.message);
  }

  console.log('\n📋 Resumen de la migración:');
  console.log('⚠️  Algunas operaciones requieren permisos de administrador (SERVICE_ROLE_KEY)');
  console.log('📝 Para ejecutar las migraciones completas, necesitas:');
  console.log('   1. Usar la SERVICE_ROLE_KEY de Supabase');
  console.log('   2. O ejecutar las migraciones desde el dashboard de Supabase');
  console.log('   3. O usar la CLI de Supabase con los permisos adecuados');
}

executeMigrations().catch(console.error);