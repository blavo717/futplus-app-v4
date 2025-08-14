import { useState, useEffect } from 'react';
import ConfigService, { AppConfig } from '../config/configService';

interface UIConfig {
  colors: {
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
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      '2xl': number;
      '3xl': number;
    };
    fontWeight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
  };
}

interface ExtendedConfig extends AppConfig {
  ui: UIConfig;
}

const defaultUIConfig: UIConfig = {
  colors: {
    primary: '#5B21B6',
    secondary: '#FFFFFF',
    accent: '#00FF88',
    background: '#0A0A0A',
    border: '#2D2D2D',
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
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 32
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 40
  }
};

export function useConfig() {
  const [config, setConfig] = useState<ExtendedConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const configService = ConfigService.getInstance();
        await configService.initialize();
        
        const appConfig: AppConfig = {
          progress: configService.getProgressConfig(),
          user: configService.getUserConfig(),
          onboarding: configService.getOnboardingConfig()
        };
        
        const extendedConfig: ExtendedConfig = {
          ...appConfig,
          ui: defaultUIConfig
        };
        
        setConfig(extendedConfig);
      } catch (err) {
        console.error('Error loading config:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        
        // Fallback to default config
        const fallbackConfig: ExtendedConfig = {
          progress: ConfigService.getInstance().getProgressConfig(),
          user: ConfigService.getInstance().getUserConfig(),
          onboarding: ConfigService.getInstance().getOnboardingConfig(),
          ui: defaultUIConfig
        };
        
        setConfig(fallbackConfig);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const getConfigValue = <T,>(key: string, defaultValue: T): T => {
    if (!config) return defaultValue;
    
    const keys = key.split('.');
    let value: any = config;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value as T;
  };

  return {
    config,
    isLoading,
    error,
    getConfigValue,
    // Convenience getters
    colors: config?.ui.colors || defaultUIConfig.colors,
    typography: config?.ui.typography || defaultUIConfig.typography,
    spacing: config?.ui.spacing || defaultUIConfig.spacing,
    progress: config?.progress,
    user: config?.user,
    onboarding: config?.onboarding
  };
}