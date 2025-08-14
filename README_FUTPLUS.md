# FutPlus - App de Desarrollo Futbolístico 🇪🇸⚽

## 🚀 Estado del Proyecto - FASE 1 Completada

### ✅ Completado:
- **Proyecto Expo inicializado** con TypeScript
- **Supabase configurado** (cliente listo, falta añadir credenciales)
- **React Navigation instalado** con estructura de 5 pantallas
- **Estructura de carpetas** organizada
- **5 pantallas principales** implementadas:
  - 🏠 Dashboard (inicio con resumen)
  - 🏃‍♂️ Entrenamiento (lista de videos)
  - 🥗 Nutrición (planes y tracking)
  - 📊 Asistencia (progreso y estadísticas)
  - 👤 Perfil (configuración usuario)

### 📱 Para probar la app:

1. **Configurar Supabase** (IMPORTANTE):
   ```bash
   # Editar .env.local con tus credenciales:
   EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
   ```

2. **Ejecutar la app**:
   ```bash
   cd futplus-app
   expo start --tunnel
   ```

3. **Escanear QR** con Expo Go en tu móvil (iOS/Android)

### 🏗️ Estructura del proyecto:
```
futplus-app/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── screens/       # 5 pantallas principales
│   ├── navigation/    # TabNavigator configurado
│   ├── services/      # Cliente Supabase
│   ├── types/         # Tipos TypeScript
│   └── config/        # Configuración
├── App.tsx           # Entry point con navegación
└── package.json      # Dependencias
```

### 🎨 Sistema de Diseño:
- **Colores**: Azul Noche (#1A1D3A), Verde Eléctrico (#00FF88), Oro (#FFD700)
- **Navegación**: Tab bar inferior con 5 pestañas
- **Estilo**: Moderno, limpio, optimizado para español

### 📝 Próximos pasos (FASE 2):
1. Configurar credenciales de Supabase reales
2. Implementar onboarding (4 pantallas)
3. Crear base de datos en Supabase
4. Añadir autenticación funcional
5. Subir videos de prueba

### 🛠️ Comandos útiles:
```bash
# Desarrollo local
expo start

# Testing remoto
expo start --tunnel

# Build para producción
eas build --platform ios
eas build --platform android
```

---
**FutPlus v1.0.0** - Mejora tu juego con entrenamiento profesional 💪