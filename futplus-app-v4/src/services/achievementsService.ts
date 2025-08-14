import { supabase } from '../config/supabase';
import ConfigService from '../config/configService';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'training' | 'nutrition' | 'performance' | 'social';
  requirement: number;
  requirement_type: 'days' | 'calories' | 'minutes' | 'goals' | 'streak';
  unlocked: boolean;
  unlocked_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked: boolean;
  unlocked_at?: string;
  achievement: Achievement;
}

class AchievementsService {
  async initializeUserAchievements(userId: string): Promise<void> {
    try {
      // Obtener configuración de logros
      const configService = ConfigService.getInstance();
      const milestones = configService.getProgressMilestones();
      
      // Obtener todos los logros disponibles
      const { data: achievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*');

      if (achievementsError) throw achievementsError;

      // Si no hay logros en la base de datos, crearlos basados en la configuración
      if (!achievements || achievements.length === 0) {
        await this.createDefaultAchievements(milestones.levels);
        // Volver a obtener los logros recién creados
        const { data: newAchievements, error: newAchievementsError } = await supabase
          .from('achievements')
          .select('*');
        
        if (newAchievementsError) throw newAchievementsError;
        
        // Crear registros de logros para el usuario (idempotente)
        const userAchievements = newAchievements!.map(achievement => ({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked: false,
        }));

        const { error } = await supabase
          .from('user_achievements')
          .upsert(userAchievements, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });

        if (error) throw error;
      } else {
        // Crear registros de logros para el usuario (todos bloqueados inicialmente)
        const userAchievements = achievements.map(achievement => ({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked: false,
        }));

        const { error } = await supabase
          .from('user_achievements')
          .upsert(userAchievements, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error initializing user achievements:', error);
      throw error;
    }
  }

  private async createDefaultAchievements(milestones: any[]): Promise<void> {
    try {
      const achievements = milestones.map((milestone) => ({
        // No seteamos id para respetar el tipo/PK de la tabla (UUID o texto)
        title: milestone.title,
        description: milestone.description,
        icon: 'trophy',
        category: 'performance' as const,
        requirement: milestone.requirement,
        requirement_type: 'goals' as const,
      }));

      const { error } = await supabase
        .from('achievements')
        .insert(achievements);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating default achievements:', error);
      throw error;
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements!user_achievements_achievement_id_fkey (*)
        `)
        .eq('user_id', userId)
        .order('achievement_id');

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting user achievements:', error);
      return [];
    }
  }

  async getRecentAchievements(userId: string, limit: number = 4): Promise<UserAchievement[]> {
    try {
      const achievements = await this.getUserAchievements(userId);
      return achievements
        .filter(a => a.unlocked)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent achievements:', error);
      return [];
    }
  }

  async getAllAchievements(userId: string): Promise<UserAchievement[]> {
    return await this.getUserAchievements(userId);
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('achievement_id', achievementId);

      if (error) throw error;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }
}

export default new AchievementsService();
