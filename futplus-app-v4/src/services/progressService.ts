import { supabase } from '../config/supabase';
import ConfigService from '../config/configService';

export interface UserProgress {
  id: string;
  user_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface WeeklyProgress {
  training: number;
  nutrition: number;
  rest: number;
}

class ProgressService {
  async initializeUserProgress(userId: string): Promise<UserProgress> {
    try {
      // Obtener valores iniciales de la configuración
      const configService = ConfigService.getInstance();
      const initialValues = configService.getInitialProgressValues();

      const { data, error } = await supabase
        .from('user_progress')
        .insert([{
          user_id: userId,
          training_days: initialValues.training_days,
          total_training_days: initialValues.total_training_days,
          nutrition_streak: initialValues.nutrition_streak,
          total_nutrition_days: initialValues.total_nutrition_days,
          rest_hours: initialValues.rest_hours,
          total_rest_hours: initialValues.total_rest_hours,
          calories_burned: initialValues.calories_burned,
          minutes_active: initialValues.minutes_active,
          current_streak: initialValues.current_streak,
          level: initialValues.level,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error initializing user progress:', error);
      throw error;
    }
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // No existe, inicializar
        return await this.initializeUserProgress(userId);
      }

      return data;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  async getWeeklyProgress(userId: string): Promise<WeeklyProgress> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      return { training: 0, nutrition: 0, rest: 0 };
    }

    return {
      training: Math.round((progress.training_days / progress.total_training_days) * 100),
      nutrition: Math.round((progress.nutrition_streak / progress.total_nutrition_days) * 100),
      rest: Math.round((progress.rest_hours / progress.total_rest_hours) * 100),
    };
  }

  async updateProgress(userId: string, updates: Partial<UserProgress>): Promise<UserProgress> {
    try {
      // Asegurar que actualizamos una única fila (pueden existir duplicados históricos)
      let { data: existing, error: selError } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (selError) throw selError;

      if (!existing) {
        const created = await this.initializeUserProgress(userId);
        existing = { id: created.id };
      }

      const { data, error } = await supabase
        .from('user_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (existing as any).id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }
}

export default new ProgressService();
