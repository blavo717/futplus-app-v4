import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProgressConfig {
  initial: {
    training_days: number;
    total_training_days: number;
    nutrition_streak: number;
    total_nutrition_days: number;
    rest_hours: number;
    total_rest_hours: number;
    calories_burned: number;
    minutes_active: number;
    current_streak: number;
    level: number;
  };
  targets: {
    training_days: number;
    nutrition_days: number;
    rest_hours: number;
  };
  milestones: {
    levels: Array<{
      level: number;
      title: string;
      description: string;
      requirement: number;
    }>;
  };
}

export interface UserConfig {
  defaults: {
    position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
    age: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    objective: 'technique' | 'fitness' | 'tactics' | 'professional';
  };
}

export interface OnboardingConfig {
  enabled: boolean;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    duration: number;
  }>;
}

export interface AppConfig {
  progress: ProgressConfig;
  user: UserConfig;
  onboarding: OnboardingConfig;
}

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig | null = null;
  private readonly CONFIG_KEY = '@futplus_config';

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Cargar configuración desde AsyncStorage
      const storedConfig = await AsyncStorage.getItem(this.CONFIG_KEY);
      
      if (storedConfig) {
        this.config = JSON.parse(storedConfig);
      } else {
        // Usar configuración por defecto si no hay almacenada
        this.config = this.getDefaultConfig();
        await this.saveConfig();
      }
    } catch (error) {
      console.error('Error initializing config:', error);
      // Usar configuración por defecto en caso de error
      this.config = this.getDefaultConfig();
    }
  }

  private getDefaultConfig(): AppConfig {
    return {
      progress: {
        initial: {
          training_days: 0,
          total_training_days: 4,
          nutrition_streak: 0,
          total_nutrition_days: 7,
          rest_hours: 0,
          total_rest_hours: 10,
          calories_burned: 0,
          minutes_active: 0,
          current_streak: 0,
          level: 1,
        },
        targets: {
          training_days: 4,
          nutrition_days: 7,
          rest_hours: 10,
        },
        milestones: {
          levels: [
            { level: 1, title: 'Principiante', description: 'Comienza tu viaje', requirement: 0 },
            { level: 2, title: 'Aficionado', description: 'Mejora tus habilidades', requirement: 10 },
            { level: 3, title: 'Intermedio', description: 'Dominio básico', requirement: 25 },
            { level: 4, title: 'Avanzado', description: 'Jugador competente', requirement: 50 },
            { level: 5, title: 'Experto', description: 'Maestro del fútbol', requirement: 100 },
          ],
        },
      },
      user: {
        defaults: {
          position: 'forward',
          age: 18,
          level: 'beginner',
          objective: 'technique',
        },
      },
      onboarding: {
        enabled: true,
        steps: [
          { id: 'welcome', title: 'Bienvenido', description: 'Descubre FutPlus', duration: 3000 },
          { id: 'training', title: 'Entrenamiento', description: 'Mejora tus habilidades', duration: 3000 },
          { id: 'nutrition', title: 'Nutrición', description: 'Alimentación optimizada', duration: 3000 },
          { id: 'community', title: 'Comunidad', description: 'Conecta con otros', duration: 3000 },
        ],
      },
    };
  }

  private async saveConfig(): Promise<void> {
    try {
      if (this.config) {
        await AsyncStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  getProgressConfig(): ProgressConfig {
    return this.config?.progress || this.getDefaultConfig().progress;
  }

  getUserConfig(): UserConfig {
    return this.config?.user || this.getDefaultConfig().user;
  }

  getOnboardingConfig(): OnboardingConfig {
    return this.config?.onboarding || this.getDefaultConfig().onboarding;
  }

  // Métodos para obtener valores específicos con fallbacks
  getInitialProgressValues() {
    return this.getProgressConfig().initial;
  }

  getProgressTargets() {
    return this.getProgressConfig().targets;
  }

  getProgressMilestones() {
    return this.getProgressConfig().milestones;
  }

  getUserDefaults() {
    return this.getUserConfig().defaults;
  }

  getOnboardingSteps() {
    return this.getOnboardingConfig().steps;
  }

  // Método para actualizar configuración (si es necesario en el futuro)
  async updateConfig(updates: Partial<AppConfig>): Promise<void> {
    try {
      if (this.config) {
        this.config = { ...this.config, ...updates };
        await this.saveConfig();
      }
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }
}

export default ConfigService;