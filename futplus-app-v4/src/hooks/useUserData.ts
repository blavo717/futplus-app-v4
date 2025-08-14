import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import progressService, { UserProgress, WeeklyProgress } from '../services/progressService';
import achievementsService, { UserAchievement } from '../services/achievementsService';
import activitiesService, { Activity } from '../services/activitiesService';

interface UserData {
  progress: UserProgress | null;
  weeklyProgress: WeeklyProgress;
  achievements: UserAchievement[];
  recentAchievements: UserAchievement[];
  activities: Activity[];
  upcomingActivities: Activity[];
  isLoading: boolean;
  error: string | null;
}

export const useUserData = () => {
  const { user, profile } = useAuth();
  const [userData, setUserData] = useState<UserData>({
    progress: null,
    weeklyProgress: { training: 0, nutrition: 0, rest: 0 },
    achievements: [],
    recentAchievements: [],
    activities: [],
    upcomingActivities: [],
    isLoading: true,
    error: null,
  });

  const loadUserData = async () => {
    if (!user?.id) {
      setUserData(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setUserData(prev => ({ ...prev, isLoading: true, error: null }));

      // Inicializar datos si no existen
      await progressService.getUserProgress(user.id);
      await achievementsService.initializeUserAchievements(user.id);

      // Cargar todos los datos
      const [
        progress,
        allAchievements,
        activities,
        upcomingActivities,
      ] = await Promise.all([
        progressService.getUserProgress(user.id),
        achievementsService.getAllAchievements(user.id),
        activitiesService.getUserActivities(user.id),
        activitiesService.getUpcomingActivities(user.id),
      ]);

      const weeklyProgress = progress 
        ? await progressService.getWeeklyProgress(user.id)
        : { training: 0, nutrition: 0, rest: 0 };

      const recentAchievements = allAchievements
        .filter(a => a.unlocked)
        .slice(0, 4);

      setUserData({
        progress,
        weeklyProgress,
        achievements: allAchievements,
        recentAchievements,
        activities,
        upcomingActivities,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar los datos del usuario',
      }));
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const refreshData = () => {
    loadUserData();
  };

  return {
    ...userData,
    user,
    profile,
    refreshData,
  };
};
