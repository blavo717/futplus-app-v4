# Configuración de Google Authentication

## Implementación completada

He implementado el flujo completo de autenticación con Google. Aquí están los pasos que necesitas completar en Supabase y Google Cloud Console.

## 1. Configurar Google Cloud Console

### Crear proyecto y habilitar APIs:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a "APIs y servicios" > "Biblioteca"
4. Busca y habilita "Google+ API" (o "Google Identity Platform")

### Crear credenciales OAuth 2.0:
1. Ve a "APIs y servicios" > "Credenciales"
2. Click en "Crear credenciales" > "ID de cliente OAuth"
3. Si es la primera vez, configura la pantalla de consentimiento:
   - Tipo de usuario: Externo
   - Nombre de la aplicación: FutPlus
   - Email de soporte: tu email
   - Dominios autorizados: tu dominio si tienes uno

### Configurar el cliente OAuth:
1. Tipo de aplicación: "Aplicación web"
2. Nombre: "FutPlus Web Client"
3. URIs de redirección autorizadas, agregar:
   ```
   https://[TU-PROYECTO-SUPABASE].supabase.co/auth/v1/callback
   ```

### Para desarrollo con Expo:
Crea otro cliente OAuth:
1. Tipo: "Aplicación web" 
2. Nombre: "FutPlus Expo Development"
3. URIs de redirección:
   ```
   https://auth.expo.io/@[TU-USUARIO-EXPO]/futplus-app
   exp://[TU-IP-LOCAL]:8081
   ```

## 2. Configurar Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com/)
2. Ve a "Authentication" > "Providers"
3. Busca "Google" y habilítalo
4. Agrega:
   - Client ID: (desde Google Cloud Console)
   - Client Secret: (desde Google Cloud Console)
5. Guarda los cambios

## 3. Variables de entorno

Asegúrate de que tu `.env` tiene:
```
EXPO_PUBLIC_SUPABASE_URL=https://[TU-PROYECTO].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[TU-ANON-KEY]
```

## 4. Probar la implementación

### En desarrollo (Expo Go):
1. Ejecuta: `npx expo start --tunnel`
2. Escanea el código QR con Expo Go
3. Presiona "Continuar con Google"
4. Se abrirá el navegador
5. Inicia sesión con Google
6. Autoriza la app
7. Serás redirigido de vuelta a la app

### Posibles problemas:

**"Invalid redirect URI"**
- Verifica que las URIs en Google Console coincidan exactamente
- Para Expo, la URI cambia según tu nombre de usuario

**"This app is blocked"**
- En desarrollo, Google puede bloquear apps no verificadas
- Agrega tu cuenta de prueba en Google Console > OAuth consent screen > Test users

**El navegador no regresa a la app**
- Verifica que el scheme `futplus://` esté configurado en app.json
- En Android, reinicia la app después de instalar

## 5. Para producción

### Android:
1. Genera el SHA-1 fingerprint:
   ```bash
   keytool -keystore path/to/your.keystore -list -v
   ```
2. Agrega el SHA-1 en Google Console
3. Crea un cliente OAuth tipo "Android"

### iOS:
1. Configura el bundle ID correcto
2. Agrega el URL scheme en Info.plist
3. Configura Associated Domains si es necesario

## Flujo implementado

1. Usuario presiona "Continuar con Google"
2. `authService.signInWithGoogle()` obtiene la URL de OAuth
3. Se abre el navegador con `WebBrowser.openAuthSessionAsync()`
4. Usuario autoriza en Google
5. Google redirige a `futplus://auth-callback` con tokens
6. La app extrae los tokens y establece la sesión
7. Se crea el perfil si es primera vez
8. Usuario queda autenticado

## Código implementado

- `authService.ts`: Flujo completo con manejo de tokens
- `AuthContext.tsx`: Actualización del estado después del login
- `App.tsx`: Manejo de deep links y `maybeCompleteAuthSession()`

El código está listo. Solo necesitas completar la configuración en Google y Supabase.