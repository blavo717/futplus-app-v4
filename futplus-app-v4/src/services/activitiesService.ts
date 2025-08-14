import { supabase } from '../config/supabase';
import ConfigService from '../config/configService';

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'training' | 'nutrition' | 'recovery';
  scheduled_time: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

class ActivitiesService {
  async initializeUserActivities(userId: string): Promise<void> {
    try {
      // Obtener configuración de onboarding
      const configService = ConfigService.getInstance();
      const onboardingConfig = configService.getOnboardingConfig();
      
      // Si el onboarding está habilitado, crear actividades iniciales basadas en la configuración
      if (onboardingConfig.enabled) {
        const activities = onboardingConfig.steps.map((step, index) => ({
          user_id: userId,
          title: step.title,
          description: step.description,
          type: 'training' as const,
          scheduled_time: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(), // Un día por cada paso
          completed: false,
        }));

        const { error } = await supabase
          .from('activities')
          .insert(activities);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error initializing user activities:', error);
      throw error;
    }
  }

  async getUserActivities(userId: string, limit: number = 4): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_time', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  async getUpcomingActivities(userId: string): Promise<Activity[]> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(4);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting upcoming activities:', error);
      return [];
    }
  }

  async createActivity(userId: string, activity: Omit<Activity, 'id' | 'user_id' | 'created_at'>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([{
          ...activity,
          user_id: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async completeActivity(activityId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', activityId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing activity:', error);
      throw error;
    }
  }
}

export default new ActivitiesService();
