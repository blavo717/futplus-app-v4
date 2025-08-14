const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan las variables de entorno EXPO_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFix() {
  console.log('🚀 Ejecutando fix para el error de registro...\n');

  try {
    // 1. Crear política INSERT
    console.log('1️⃣ Creando política INSERT para profiles...');
    const { data: policy1, error: policyError } = await supabase.rpc('query', {
      query: `CREATE POLICY IF NOT EXISTS "Los usuarios pueden crear su propio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);`
    }).catch(err => ({ error: err }));

    if (policyError && !policyError.message?.includes('already exists')) {
      console.log('⚠️  La política podría ya existir o hubo un error:', policyError.message);
    } else {
      console.log('✅ Política INSERT creada o ya existente\n');
    }

    // 2. Actualizar función handle_new_user
    console.log('2️⃣ Actualizando función handle_new_user...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Solo crear perfil si no existe
          INSERT INTO public.profiles (user_id, name)
          VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'))
          ON CONFLICT (user_id) DO NOTHING;
          
          -- Solo crear stats si no existen
          INSERT INTO public.user_stats (user_id)
          VALUES (NEW.id)
          ON CONFLICT (user_id) DO NOTHING;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    const { error: functionError } = await supabase.rpc('query', {
      query: functionSQL
    }).catch(err => ({ error: err }));

    if (functionError) {
      console.log('⚠️  Error actualizando función:', functionError.message);
    } else {
      console.log('✅ Función handle_new_user actualizada\n');
    }

    // 3. Verificar políticas
    console.log('3️⃣ Verificando políticas actuales...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('polname, polcmd')
      .eq('tablename', 'profiles');

    if (policiesError) {
      console.log('⚠️  No se pudieron verificar las políticas:', policiesError.message);
    } else if (policies) {
      console.log('📋 Políticas encontradas:');
      policies.forEach(p => {
        const command = { r: 'SELECT', a: 'INSERT', w: 'UPDATE', d: 'DELETE' }[p.polcmd] || p.polcmd;
        console.log(`   - ${p.polname} (${command})`);
      });
      console.log('');
    }

    // 4. Verificar RLS
    console.log('4️⃣ Verificando Row Level Security...');
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'profiles')
      .single();

    if (tablesError) {
      console.log('⚠️  No se pudo verificar RLS:', tablesError.message);
    } else if (tables) {
      console.log(`✅ RLS está ${tables.rowsecurity ? 'HABILITADO' : 'DESHABILITADO'} para la tabla profiles\n`);
    }

    console.log('🎉 ¡Fix ejecutado! Ahora deberías poder registrar usuarios sin problemas.\n');
    console.log('📝 Próximos pasos:');
    console.log('   1. Prueba registrar un nuevo usuario en la app');
    console.log('   2. Si aún hay errores, revisa el dashboard de Supabase');
    console.log('   3. Asegúrate de que las políticas estén activas en Authentication > Policies\n');

  } catch (error) {
    console.error('❌ Error general:', error);
    console.log('\n⚠️  Si el error persiste, ejecuta el script SQL manualmente en Supabase Dashboard');
  }
}

// Ejecutar el fix
executeSQLFix();