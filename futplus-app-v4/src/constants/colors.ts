import { useConfig } from '../hooks/useConfig';

// Tipo para la estructura de colores
type ColorConfig = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  border: string;
  overlay: string;
  glass: {
    background: string;
    border: string;
    pressed: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  gradient: {
    primary: readonly [string, string, string];
    purple: readonly [string, string, string];
    green: readonly [string, string, string];
    dark: readonly [string, string, string];
  };
};

// Colores por defecto (fallback)
const defaultColors: ColorConfig = {
  primary: '#5B21B6',      // Morado (del logo)
  secondary: '#FFFFFF',    // Blanco
  accent: '#00FF88',       // Verde Eléctrico
  background: '#0A0A0A',   // Negro para fondos
  border: '#2D2D2D',       // Border color
  overlay: 'rgba(91, 33, 182, 0.7)',
  glass: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.25)',
    pressed: 'rgba(255, 255, 255, 0.25)'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#E5E5E5',
    muted: '#A0A0A0'
  },
  gradient: {
    primary: ['#5B21B6', '#7C3AED', '#00FF88'] as const,
    purple: ['#5B21B6', '#7C3AED', '#9333EA'] as const,
    green: ['#00FF88', '#10B981', '#059669'] as const,
    dark: ['#0A0A0A', '#1F1F1F', '#2D2D2D'] as const
  }
};

// Variable global para almacenar los colores dinámicos
let dynamicColors: ColorConfig | null = null;
let configListeners: Set<() => void> = new Set();

// Función para actualizar los colores dinámicos
export function updateDynamicColors(colors: ColorConfig) {
  dynamicColors = colors;
  // Notificar a todos los listeners que los colores han cambiado
  configListeners.forEach(listener => listener());
}

// Función para suscribirse a cambios de colores
export function subscribeToColorChanges(listener: () => void) {
  configListeners.add(listener);
  // Retornar función para unsuscribirse
  return () => {
    configListeners.delete(listener);
  };
}

// Función para obtener los colores actuales (dinámicos o por defecto)
export function getCurrentColors(): ColorConfig {
  return dynamicColors || defaultColors;
}

// Hook personalizado para usar colores dinámicos en componentes
export function useColors(): ColorConfig {
  const { colors: configColors } = useConfig();
  
  // Actualizar los colores dinámicos cuando la configuración cambia
  if (configColors && JSON.stringify(configColors) !== JSON.stringify(dynamicColors)) {
    updateDynamicColors(configColors);
  }
  
  return getCurrentColors();
}

// Exportar Colors como un proxy que se actualiza dinámicamente
// Esto mantiene la compatibilidad con el código existente
export const Colors: ColorConfig = new Proxy(defaultColors, {
  get(target, prop) {
    const currentColors = getCurrentColors();
    return currentColors[prop as keyof ColorConfig];
  },
  
  // Permitir que Object.keys() y otros métodos funcionen correctamente
  ownKeys(target) {
    const currentColors = getCurrentColors();
    return Object.getOwnPropertyNames(currentColors);
  },
  
  getOwnPropertyDescriptor(target, prop) {
    const currentColors = getCurrentColors();
    return Object.getOwnPropertyDescriptor(currentColors, prop);
  }
});

// Exportar los colores por defecto para referencia
export { defaultColors };