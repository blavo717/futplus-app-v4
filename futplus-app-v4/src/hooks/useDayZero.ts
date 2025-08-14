import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserData } from './useUserData';

interface DayZeroState {
  isDayZero: boolean;
  hasCompletedOnboarding: boolean;
  hasStartedTraining: boolean;
  hasProgress: boolean;
  isLoading: boolean;
}

export function useDayZero(): DayZeroState {
  const { user, profile } = useAuth();
  const { progress, isLoading: userDataLoading } = useUserData();
  const [state, setState] = useState<DayZeroState>({
    isDayZero: true,
    hasCompletedOnboarding: false,
    hasStartedTraining: false,
    hasProgress: false,
    isLoading: true
  });

  useEffect(() => {
    const determineDayZeroState = () => {
      if (!user || !profile) {
        return {
          isDayZero: true,
          hasCompletedOnboarding: false,
          hasStartedTraining: false,
          hasProgress: false,
          isLoading: false
        };
      }

      // Check if user has completed onboarding (using profile creation date as proxy)
      const hasCompletedOnboarding = profile ? true : false;

      // Check if user has started training
      const hasStartedTraining = progress ? progress.training_days > 0 : false;

      // Check if user has any progress
      const hasProgress = progress ? (
        progress.training_days > 0 ||
        progress.nutrition_streak > 0 ||
        progress.calories_burned > 0 ||
        progress.minutes_active > 0 ||
        progress.current_streak > 0
      ) : false;

      // User is in day zero if they haven't completed onboarding OR haven't started training
      const isDayZero = !hasCompletedOnboarding || !hasStartedTraining;

      return {
        isDayZero,
        hasCompletedOnboarding,
        hasStartedTraining,
        hasProgress,
        isLoading: false
      };
    };

    if (!userDataLoading) {
      setState(determineDayZeroState());
    }
  }, [user, profile, progress, userDataLoading]);

  return state;
}

// Additional hook for day zero specific content
export function useDayZeroContent() {
  const { isDayZero, hasCompletedOnboarding, hasStartedTraining } = useDayZero();

  const getWelcomeMessage = () => {
    if (!hasCompletedOnboarding) {
      return {
        title: "¡Bienvenido a FutPlus! 🎉",
        subtitle: "Comienza tu viaje futbolístico",
        description: "Estás a punto de comenzar una increíble aventura. Completa el onboarding para descubrir todo lo que FutPlus puede ofrecerte."
      };
    } else if (!hasStartedTraining) {
      return {
        title: "¡Listo para empezar! ⚽",
        subtitle: "Tu primer entrenamiento te espera",
        description: "Ahora que conoces FutPlus, es hora de comenzar a entrenar. Tu primer paso hacia la excelencia futbolística."
      };
    } else {
      return {
        title: "¡Bienvenido de vuelta! 🔥",
        subtitle: "Continúa tu progreso",
        description: "Sigue trabajando en tus habilidades y alcanza nuevas metas."
      };
    }
  };

  const getCallToAction = () => {
    if (!hasCompletedOnboarding) {
      return {
        text: "Comenzar Onboarding",
        action: "onboarding"
      };
    } else if (!hasStartedTraining) {
      return {
        text: "Comenzar Entrenamiento",
        action: "training"
      };
    } else {
      return {
        text: "Ver Progreso",
        action: "progress"
      };
    }
  };

  const getEmptyStateMessage = (type: 'achievements' | 'activities' | 'progress') => {
    const baseMessages = {
      achievements: {
        title: "Aún no tienes logros",
        subtitle: "Completa entrenamientos para desbloquear logros"
      },
      activities: {
        title: "No tienes actividades programadas",
        subtitle: "Comienza tu primer entrenamiento para ver tu progreso"
      },
      progress: {
        title: "Comienza tu viaje",
        subtitle: "Tu progreso aparecerá aquí una vez que comiences"
      }
    };

    if (!hasCompletedOnboarding) {
      return {
        ...baseMessages[type],
        action: "Completa el onboarding para comenzar"
      };
    } else if (!hasStartedTraining) {
      return {
        ...baseMessages[type],
        action: "Comienza tu primer entrenamiento"
      };
    } else {
      return baseMessages[type];
    }
  };

  return {
    isDayZero,
    hasCompletedOnboarding,
    hasStartedTraining,
    getWelcomeMessage,
    getCallToAction,
    getEmptyStateMessage
  };
}