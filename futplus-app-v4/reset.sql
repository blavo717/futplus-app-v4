-- reset.sql
-- Script para limpiar completamente todos los datos de usuarios y empezar desde cero
-- ⚠️ ADVERTENCIA: Este script ELIMINARÁ TODOS LOS DATOS. Úsalo solo en desarrollo.

-- ==============================================================================
-- PASO 1: Limpiar tabla profiles
-- ==============================================================================
-- Primero limpiamos profiles porque tiene foreign key constraint con auth.users
TRUNCATE TABLE profiles CASCADE;

-- Alternativamente, si TRUNCATE no funciona por permisos:
-- DELETE FROM profiles;

-- ==============================================================================
-- PASO 2: Limpiar usuarios de autenticación
-- ==============================================================================
-- Opción A: Eliminar TODOS los usuarios (más agresivo)
-- NOTA: Esto requiere permisos de service_role en Supabase
-- Puedes ejecutar esto desde la consola SQL de Supabase

-- Primero, obtener la lista de usuarios para confirmar
SELECT id, email, created_at FROM auth.users;

-- Eliminar todos los usuarios
-- CUIDADO: Esto eliminará TODOS los usuarios, incluyendo los de producción si lo ejecutas ahí
DELETE FROM auth.users;

-- Opción B: Eliminar usuarios específicos (más seguro)
-- Descomenta y modifica según necesites:
/*
DELETE FROM auth.users 
WHERE email IN (
    'usuario1@ejemplo.com',
    'usuario2@ejemplo.com'
);
*/

-- Opción C: Eliminar usuarios de prueba por patrón
-- DELETE FROM auth.users WHERE email LIKE '%@test.com';

-- ==============================================================================
-- PASO 3: Limpiar sesiones activas
-- ==============================================================================
-- Esto forzará el cierre de todas las sesiones activas
TRUNCATE auth.sessions CASCADE;

-- ==============================================================================
-- PASO 4: Limpiar tokens de actualización
-- ==============================================================================
TRUNCATE auth.refresh_tokens CASCADE;

-- ==============================================================================
-- PASO 5: Verificar que todo se limpió correctamente
-- ==============================================================================
-- Verificar usuarios
SELECT COUNT(*) as total_users FROM auth.users;

-- Verificar profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Verificar sesiones activas
SELECT COUNT(*) as active_sessions FROM auth.sessions;

-- ==============================================================================
-- INSTRUCCIONES ADICIONALES PARA LIMPIEZA COMPLETA
-- ==============================================================================
/*
Para una limpieza completa y empezar como usuario nuevo, también debes:

EN LA APLICACIÓN (React Native):

1. Limpiar AsyncStorage:
   - Abre la app
   - Ve a la pantalla de Perfil
   - Presiona "Cerrar sesión" si hay una sesión activa
   
2. Si no puedes acceder a la app, ejecuta este código en tu componente:
   ```javascript
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   // Limpiar todo AsyncStorage
   await AsyncStorage.clear();
   ```

3. O desde la terminal con Expo:
   - Para Android: adb shell pm clear com.tuapp.nombre
   - Para iOS: Elimina y reinstala la app
   
4. Si usas Expo Go:
   - Limpia la caché: expo start -c

DESPUÉS DE EJECUTAR ESTE SCRIPT:

1. Todas las tablas estarán vacías
2. No habrá usuarios registrados
3. No habrá sesiones activas
4. La app detectará que eres un usuario nuevo
5. Verás el onboarding inicial

NOTA DE SEGURIDAD:
- NUNCA ejecutes este script en producción
- Siempre haz backup antes de ejecutar
- Verifica que estás en el proyecto correcto en Supabase
*/

-- ==============================================================================
-- INFORMACIÓN DE DEPURACIÓN
-- ==============================================================================
-- Mostrar información útil después de la limpieza
SELECT 
    'Limpieza completada' as status,
    NOW() as executed_at,
    (SELECT COUNT(*) FROM auth.users) as remaining_users,
    (SELECT COUNT(*) FROM profiles) as remaining_profiles,
    (SELECT COUNT(*) FROM auth.sessions) as active_sessions;