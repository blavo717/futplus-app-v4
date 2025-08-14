import React, { useCallback, useEffect } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import GradientBackground from '../components/common/GradientBackground';
import TrainingSessionView from '../components/training/TrainingSessionView';
import { useAuth } from '../contexts/AuthContext';
import useTodayPlan from '../hooks/useTodayPlan';
import trainingAnalyticsService from '../services/trainingAnalyticsService';
 
/**
 * Pantalla dedicada para realizar el entrenamiento del día.
 * Usa TrainingSessionView directamente (sin Modal).
 */
const TrainingSessionScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { summary } = useTodayPlan();
 
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
 
  // Analítica: session_start al montar y session_end al salir
  useEffect(() => {
    const uid = user?.id ?? null;
    const planId = summary?.plan_id ?? null;
    trainingAnalyticsService.recordSessionStart(uid, planId).catch(() => {});
    return () => {
      trainingAnalyticsService.recordSessionEnd(uid, planId).catch(() => {});
    };
  }, [user?.id, summary?.plan_id]);
 
  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <TrainingSessionView onClose={handleClose} />
    </SafeAreaView>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
 
export default TrainingSessionScreen;