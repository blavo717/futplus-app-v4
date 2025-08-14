# FutPlus - Desarrollo Futbolístico Profesional 🇪🇸

![FutPlus Logo](logo%20futplus.png)

## 🎯 ¿Qué es FutPlus?

FutPlus es la aplicación móvil definitiva para futbolistas que quieren mejorar su rendimiento. Diseñada específicamente para el mercado español, ofrece entrenamientos profesionales, planes nutricionales personalizados y seguimiento detallado del progreso.

## ✨ Características Principales

### 🆓 Plan Gratuito
- 📹 3 videos de entrenamiento semanales
- 🥗 Plan nutricional de ejemplo (1 día)
- ✅ Seguimiento básico con checkmarks
- 📊 Dashboard con métricas esenciales
- 🎯 1 evaluación inicial

### 💎 Plan Premium (€9.99/mes)
- 📚 Biblioteca completa de videos
- 🍎 Planes nutricionales personalizados semanales
- 📈 Estadísticas avanzadas de progreso
- 🔄 Evaluaciones ilimitadas
- 👥 Acceso completo a comunidad



## 🎯 Flujo de Usuario

1. **Bienvenida** → Selección de plan
2. **Registro** → Email o Google
3. **Perfil inicial** → Posición, edad, objetivo
4. **Dashboard** → Vista principal personalizada
5. **Entrenamiento** → Videos y seguimiento
6. **Nutrición** → Planes y tracking
7. **Progreso** → Estadísticas y logros

## 📊 Métricas y Analytics

### Eventos principales
- `registro_completado`
- `plan_seleccionado`
- `video_visto`
- `checkin_diario`
- `upgrade_intentado`
- `suscripcion_completada`

### KPIs clave
- Tasa conversión gratis → premium
- Retención diaria/semanal
- Tiempo promedio en app
- Videos más populares

## 🎨 Sistema de Diseño

### Colores
- **Primario**: #5B21B6 (Morado - del logo)
- **Secundario**: #00FF88 (Verde Eléctrico)
- **Background**: #0A0A0A (Negro para fondos)
- **Glass**: rgba(255, 255, 255, 0.15) con bordes transparentes
- **Neutros**: #F8F9FA, #6C757D, #343A40

### Tipografía
- **Principal**: Inter (optimizado para español)
- **Números**: Roboto Mono

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de contribución
- Todo el código debe estar en español
- Seguir las convenciones de TypeScript
- Incluir tests para nuevas funcionalidades
- Documentar componentes con JSDoc

## 🗓️ Plan de Desarrollo - Implementación por Fases

### 🏗️ **Arquitectura Técnica**
- **Frontend**: React Native + Expo Go + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Functions)
- **Testing**: Expo Go Tunnel para testing remoto en cada fase
- **Navegación**: React Navigation 6 (Tab + Stack)

### 📱 **Estructura de Pantallas Principales**

1. **🏠 Dashboard** - Pantalla inicial con resumen y accesos rápidos
2. **🏃‍♂️ Entrenamiento** - Videos, ejercicios y rutinas personalizadas
3. **🥗 Nutrición** - Planes alimentarios y tracking nutricional
4. **📊 Asistencia** - Seguimiento de progreso y estadísticas detalladas
5. **👤 Perfil** - Gestión de usuario, configuración y premium

---

### **FASE 1: Fundación (Semana 1-2)**

#### **Checkpoint 1.1: Setup Proyecto**
- [x] Inicializar Expo con TypeScript ✅
- [x] Configurar Supabase client ✅
- [x] Setup React Navigation ✅
- [x] Configurar ESLint + Prettier ✅
- [x] Estructura de carpetas base ✅

#### **Checkpoint 1.2: Autenticación**
- [x] Onboarding (4 pantallas) ✅
- [x] Registro/Login con Supabase Auth ✅
- [x] Manejo de estados de sesión ✅
- [x] Perfil inicial del usuario ✅

#### **Checkpoint 1.3: Navegación Base**
- [x] Tab Navigator principal (5 tabs) ✅
- [x] Stack Navigator por sección ✅
- [x] Guard de autenticación ✅
- [x] Loading states ✅

#### **🧪 TESTING FASE 1**
- [ ] `expo start --tunnel` - Verificar onboarding completo
- [ ] Testing en iOS/Android simultáneo
- [ ] Validar navegación entre pestañas
- [ ] Confirmar autenticación funcional

---

### **FASE 2: Dashboard + Core (Semana 3-4)**

#### **Checkpoint 2.1: Dashboard**
- [ ] Layout principal responsive
- [ ] Tarjetas de resumen (entrenamientos, nutrición)
- [ ] Progreso semanal visual
- [ ] Quick actions (entrenar hoy, ver plan)
- [ ] Notificaciones/recordatorios

#### **Checkpoint 2.2: Base de Datos**
- [ ] Esquema Supabase completo
- [ ] Tablas: users, videos, nutrition_plans, progress
- [ ] Policies de seguridad (RLS)
- [ ] Seeds de datos de prueba

#### **Checkpoint 2.3: Sistema de Videos**
- [ ] Listado de videos por categoría
- [ ] Player de video integrado
- [ ] Marcado como "visto"
- [ ] Filtros por nivel/posición

#### **🧪 TESTING FASE 2**
- [ ] `expo start --tunnel` - Dashboard completamente funcional
- [ ] Verificar carga de datos desde Supabase
- [ ] Testing de reproducción de videos
- [ ] Validar responsive en múltiples dispositivos

---

### **FASE 3: Entrenamiento (Semana 5-6)**

#### **Checkpoint 3.1: Biblioteca de Videos**
- [ ] Grid de videos con thumbnails
- [ ] Categorías (técnica, físico, táctico)
- [ ] Búsqueda y filtros avanzados
- [ ] Favoritos y listas personalizadas

#### **Checkpoint 3.2: Player y Tracking**
- [ ] Video player con controles custom
- [ ] Tracking de tiempo visto
- [ ] Notas personales por video
- [ ] Compartir videos (social)

#### **Checkpoint 3.3: Planes de Entrenamiento**
- [ ] Rutinas semanales personalizadas
- [ ] Calendario de entrenamientos
- [ ] Recordatorios push
- [ ] Progresión de dificultad

#### **🧪 TESTING FASE 3**
- [ ] `expo start --tunnel` - Biblioteca completa funcional
- [ ] Testing de filtros y búsqueda
- [ ] Validar player en diferentes conexiones
- [ ] Verificar tracking de progreso

---

### **FASE 4: Nutrición (Semana 7-8)**

#### **Checkpoint 4.1: Planes Nutricionales**
- [ ] Visualización de planes semanales
- [ ] Recetas detalladas con ingredientes
- [ ] Cálculos nutricionales automáticos
- [ ] Lista de compras generada

#### **Checkpoint 4.2: Tracking Nutricional**
- [ ] Registro de comidas diarias
- [ ] Fotos de platos (opcional)
- [ ] Hidratación tracking
- [ ] Gráficos de adherencia

#### **Checkpoint 4.3: Personalización**
- [ ] Preferencias alimentarias
- [ ] Alergias e intolerancias
- [ ] Ajuste de calorías por objetivo
- [ ] Sustituciones inteligentes

#### **🧪 TESTING FASE 4**
- [ ] `expo start --tunnel` - Módulo nutrición completo
- [ ] Testing de cálculos nutricionales
- [ ] Validar formularios y preferencias
- [ ] Verificar generación de listas

---

### **FASE 5: Asistencia (Semana 9-10)**

#### **Checkpoint 5.1: Dashboard de Progreso**
- [ ] Métricas principales (entrenamientos completados)
- [ ] Gráficos de evolución temporal
- [ ] Estadísticas comparativas
- [ ] Logros y medallas

#### **Checkpoint 5.2: Analytics Detallados**
- [ ] Tiempo invertido por categoría
- [ ] Análisis de consistencia
- [ ] Predicciones de progreso
- [ ] Reportes semanales/mensuales

#### **Checkpoint 5.3: Gamificación**
- [ ] Sistema de puntos
- [ ] Rachas de entrenamiento
- [ ] Desafíos semanales
- [ ] Leaderboard (opcional)

#### **🧪 TESTING FASE 5**
- [ ] `expo start --tunnel` - Analytics y estadísticas
- [ ] Testing de gráficos y visualizaciones
- [ ] Validar cálculos de progreso
- [ ] Verificar sistema de logros

---

### **FASE 6: Perfil + Premium (Semana 11-12)**

#### **Checkpoint 6.1: Gestión de Perfil**
- [ ] Edición de datos personales
- [ ] Foto de perfil
- [ ] Configuración de notificaciones
- [ ] Preferencias de privacidad

#### **Checkpoint 6.2: Sistema Premium**
- [ ] Integración Stripe + Supabase
- [ ] Paywall para contenido premium
- [ ] Gestión de suscripciones
- [ ] Contenido exclusivo desbloqueado

#### **Checkpoint 6.3: Configuración Avanzada**
- [ ] Backup y sincronización
- [ ] Exportar datos
- [ ] Soporte/contacto
- [ ] Términos y condiciones

#### **🧪 TESTING FASE 6**
- [ ] `expo start --tunnel` - Sistema premium completo
- [ ] Testing de flujo de pago (Stripe sandbox)
- [ ] Validar paywall y restricciones
- [ ] Verificar gestión de perfil

---

### **FASE 7: Optimización + Deploy (Semana 13-14)**

#### **Checkpoint 7.1: Performance**
- [ ] Optimización de imágenes
- [ ] Lazy loading para videos
- [ ] Caching estratégico
- [ ] Bundle size optimization

#### **Checkpoint 7.2: Testing**
- [ ] Tests unitarios componentes clave
- [ ] Tests E2E flujos principales
- [ ] Testing en dispositivos reales
- [ ] Performance testing

#### **Checkpoint 7.3: Deploy**
- [ ] Build para App Store/Play Store
- [ ] Configuración CI/CD
- [ ] Analytics de producción
- [ ] Monitoreo de errores

#### **🧪 TESTING FINAL FASE 7**
- [ ] `expo start --tunnel` - App completa optimizada
- [ ] Testing intensivo en múltiples dispositivos
- [ ] Validar performance en conexiones lentas
- [ ] Preparación para builds de producción

---

### 📱 **Protocolo de Testing con Expo Go**

#### **Configuración del Tunnel**
```bash
# En cada fin de fase
expo start --tunnel
```

#### **Testing Checklist por Fase**
- [ ] **iOS Testing**: iPhone (múltiples versiones)
- [ ] **Android Testing**: Diferentes fabricantes
- [ ] **Network Testing**: WiFi + 4G + conexión lenta
- [ ] **UX Testing**: Navegación intuitiva
- [ ] **Performance**: Tiempo de carga < 3s

#### **Dispositivos de Testing Recomendados**
- iPhone 12/13 (iOS 15+)
- Samsung Galaxy S21+ (Android 12+)
- Dispositivo gama media (testing performance)

---

### 📊 **Métricas de Éxito por Fase**

| Fase | Métrica Clave | Testing Objetivo |
|------|---------------|------------------|
| 1 | Setup completo | Navegación fluida en tunnel |
| 2 | Dashboard funcional | Datos cargan < 2s |
| 3 | Videos reproducibles | 0 errores streaming |
| 4 | Planes visualizables | UX intuitiva validada |
| 5 | Analytics básicos | Gráficos renderizados |
| 6 | Premium funcional | Paywall testing completo |
| 7 | App optimizada | Performance > 90/100 |

---

## 📈 Progreso Actual

### ✅ Hitos Completados

#### **FASE 1: Fundación - COMPLETADA AL 100%**
- ✅ **Checkpoint 1.1: Setup Proyecto completado**
  - Proyecto Expo inicializado con TypeScript
  - Cliente Supabase configurado y funcionando
  - React Navigation instalado y configurado
  - ESLint + Prettier configurados para calidad de código
  - Estructura de carpetas organizada y lista

- ✅ **Checkpoint 1.2: Sistema de Autenticación (Completado)**
  - 5 pantallas de autenticación implementadas:
    - AuthChoiceScreen - Selección entre Google y Email
    - LoginScreen - Con validaciones y "Recordarme"
    - RegisterScreen - Con indicador de fuerza de contraseña
    - ProfileSetupScreen - Configuración en 3 pasos
    - ForgotPasswordScreen - Recuperación de contraseña
  - Integración completa con Supabase Auth
  - AuthContext y authService implementados
  - Diseño Glass Morphism consistente

- ✅ **Checkpoint 1.3: Navegación Completa (Completado)**
  - AuthNavigator con transiciones suaves
  - 5 Stack Navigators (uno por tab):
    - DashboardStack
    - EntrenamientoStack
    - NutricionStack
    - AsistenciaStack
    - PerfilStack
  - Guards de autenticación implementados (AuthGuard y ProfileGuard)
  - Flujo automático según estado del usuario
  - Loading states con animaciones

- ✅ **Onboarding completado y probado** - Las 4 pantallas de onboarding funcionan correctamente
  - Navegación fluida entre pantallas
  - Diseño responsive validado
  - Experiencia de usuario intuitiva

### 🧪 Resultados de Testing

#### **Onboarding Testing (Completado)**
- ✅ Navegación entre las 4 pantallas sin errores
- ✅ Transiciones suaves y animaciones funcionando
- ✅ Diseño responsive en diferentes tamaños de pantalla
- ✅ Flujo de usuario intuitivo y claro

---

## 🏗️ Arquitectura Implementada

### **Sistema de Autenticación**
- Email/Password con validaciones en tiempo real
- Google OAuth (preparado, requiere configuración en Supabase)
- Recuperación de contraseña funcional
- Persistencia de sesión con AsyncStorage
- AuthContext para estado global

### **Componentes Glass Morphism**
- **GlassInput**: Inputs con efecto transparente y animaciones
- **GlassCard**: Tarjetas con efecto glass y bordes suaves
- **GlassButton**: Botones con variantes glass y primary
- **GoogleButton**: Botón específico para autenticación Google
- **AuthDivider**: Separador estilizado para opciones
- **PasswordStrength**: Indicador visual de fuerza de contraseña
- **PositionCard**: Tarjetas animadas para selección
- **AuthLayout**: Layout base con fondos deportivos

### **Navegación Inteligente**
```
App → AuthProvider → RootNavigator
         ↓               ↓
   AuthContext      Verificaciones:
         ↓          - Onboarding completado
   Estado Global    - Usuario autenticado
         ↓          - Perfil completo
   Auto-navegación      ↓
                   Destino correcto:
                   - OnboardingNavigator
                   - AuthNavigator
                   - ProfileSetupScreen
                   - TabNavigator (con 5 stacks)
```

### **Flujo de Usuario Implementado**
1. **Primera vez**: Onboarding (4 pantallas) → Auth
2. **Sin autenticar**: AuthChoice → Login/Register
3. **Autenticado sin perfil**: ProfileSetup (3 pasos)
4. **Usuario completo**: Dashboard con 5 tabs

---

## 🚀 Próximos Pasos

### **Inmediato**

1. **Configurar Supabase Backend**
   - Crear tabla `profiles` con campos necesarios
   - Habilitar Google OAuth en dashboard de Supabase
   - Configurar políticas RLS para seguridad
   - Agregar triggers para sincronización usuario-perfil

2. **Iniciar FASE 2: Dashboard + Core**
   - Diseñar Dashboard principal con datos reales
   - Implementar sistema de videos con Supabase Storage
   - Crear estructura de base de datos completa
   - Implementar las tarjetas de resumen dinámicas

### **Prioridades para las próximas 2 semanas**

1. **Semana 1**: Backend y Dashboard
   - Configuración completa de Supabase
   - Dashboard funcional con datos reales
   - Sistema básico de videos

2. **Semana 2**: Sistema de Videos y Nutrición
   - Player de video personalizado
   - Categorización y filtros
   - Inicio del módulo de nutrición

### **Testing Continuo**
- Mantener testing con `expo start --tunnel` después de cada implementación
- Validar en dispositivos iOS y Android reales
- Documentar cualquier issue encontrado

## 📋 Documentación Adicional

- [📋 Mapa de Documentos](INDICE.md) - Guía de todos los archivos

## 📞 Soporte

- 📧 Email: soporte@futplus.es
- 💬 Discord: [FutPlus Community](https://discord.gg/futplus)
- 📱 Twitter: [@FutPlusApp](https://twitter.com/FutPlusApp)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

**FutPlus** - Mejora tu juego con entrenamiento profesional 💪⚽