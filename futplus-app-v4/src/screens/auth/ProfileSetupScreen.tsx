import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/auth/AuthLayout';
import GlassCard from '../../components/auth/GlassCard';
import GlassInput from '../../components/auth/GlassInput';
import GlassButton from '../../components/onboarding/GlassButton';
import PositionCard from '../../components/auth/PositionCard';
import { Colors } from '../../constants/colors';

type AuthStackParamList = {
  ProfileSetup: undefined;
};

type ProfileSetupNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'ProfileSetup'
>;

interface ProfileData {
  position: string;
  age: string;
  level: string;
  objective: string;
}

const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<ProfileSetupNavigationProp>();
  const { updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    position: '',
    age: '',
    level: '',
    objective: '',
  });

  const positions = [
    { id: 'goalkeeper', title: 'Portero', icon: '🥅' },
    { id: 'defender', title: 'Defensa', icon: '🛡️' },
    { id: 'midfielder', title: 'Mediocampista', icon: '⚡' },
    { id: 'forward', title: 'Delantero', icon: '⚽' },
  ];

  const levels = [
    { id: 'beginner', title: 'Principiante', description: 'Estoy empezando' },
    { id: 'intermediate', title: 'Intermedio', description: 'Tengo experiencia' },
    { id: 'advanced', title: 'Avanzado', description: 'Juego regularmente' },
  ];

  const objectives = [
    { id: 'technique', title: 'Mejorar técnica', icon: '🎯', description: 'Perfeccionar habilidades individuales' },
    { id: 'fitness', title: 'Condición física', icon: '💪', description: 'Aumentar resistencia y fuerza' },
    { id: 'tactics', title: 'Táctica y visión', icon: '🧠', description: 'Entender mejor el juego' },
    { id: 'professional', title: 'Preparación profesional', icon: '⭐', description: 'Alcanzar el máximo nivel' },
  ];

  const handleNextStep = () => {
    if (currentStep === 1 && !profileData.position) {
      Alert.alert('Error', 'Por favor selecciona tu posición');
      return;
    }
    if (currentStep === 2) {
      if (!profileData.age) {
        Alert.alert('Error', 'Por favor ingresa tu edad');
        return;
      }
      if (!profileData.level) {
        Alert.alert('Error', 'Por favor selecciona tu nivel');
        return;
      }
    }
    
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!profileData.objective) {
      Alert.alert('Error', 'Por favor selecciona tu objetivo principal');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        position: profileData.position as any,
        age: parseInt(profileData.age),
        level: profileData.level as any,
        objective: profileData.objective as any,
      });
      // La navegación al dashboard se maneja automáticamente en RootNavigator
    } catch (error) {
      // El error ya se muestra en AuthContext
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿Cuál es tu posición?</Text>
      <Text style={styles.stepSubtitle}>Esto nos ayudará a personalizar tu entrenamiento</Text>
      
      <View style={styles.positionsGrid}>
        {positions.map((position) => (
          <PositionCard
            key={position.id}
            title={position.title}
            icon={position.icon}
            selected={profileData.position === position.id}
            onPress={() => setProfileData({ ...profileData, position: position.id })}
          />
        ))}
      </View>

      <GlassButton
        title="Siguiente"
        onPress={handleNextStep}
        variant="primary"
        style={styles.nextButton}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cuéntanos sobre ti</Text>
      <Text style={styles.stepSubtitle}>Información básica para personalizar tu experiencia</Text>
      
      <GlassCard style={styles.formCard}>
        <GlassInput
          label="Edad"
          icon="calendar"
          placeholder="Ej: 18"
          value={profileData.age}
          onChangeText={(text) => setProfileData({ ...profileData, age: text })}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>Nivel actual</Text>
        {levels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.levelOption,
              profileData.level === level.id && styles.levelOptionSelected
            ]}
            onPress={() => setProfileData({ ...profileData, level: level.id })}
          >
            <View>
              <Text style={[
                styles.levelTitle,
                profileData.level === level.id && styles.levelTitleSelected
              ]}>
                {level.title}
              </Text>
              <Text style={styles.levelDescription}>{level.description}</Text>
            </View>
            <View style={[
              styles.radio,
              profileData.level === level.id && styles.radioSelected
            ]} />
          </TouchableOpacity>
        ))}
      </GlassCard>

      <View style={styles.navigationButtons}>
        <GlassButton
          title="Atrás"
          onPress={handlePreviousStep}
          variant="glass"
          style={styles.backButton}
        />
        <GlassButton
          title="Siguiente"
          onPress={handleNextStep}
          variant="primary"
          style={styles.nextButtonSmall}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿Cuál es tu objetivo principal?</Text>
      <Text style={styles.stepSubtitle}>Nos enfocaremos en lo que más te importa</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {objectives.map((objective) => (
          <TouchableOpacity
            key={objective.id}
            style={[
              styles.objectiveCard,
              profileData.objective === objective.id && styles.objectiveCardSelected
            ]}
            onPress={() => setProfileData({ ...profileData, objective: objective.id })}
          >
            <Text style={styles.objectiveIcon}>{objective.icon}</Text>
            <View style={styles.objectiveContent}>
              <Text style={[
                styles.objectiveTitle,
                profileData.objective === objective.id && styles.objectiveTitleSelected
              ]}>
                {objective.title}
              </Text>
              <Text style={[
                styles.objectiveDescription,
                profileData.objective === objective.id && styles.objectiveDescriptionSelected
              ]}>
                {objective.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.navigationButtons}>
        <GlassButton
          title="Atrás"
          onPress={handlePreviousStep}
          variant="glass"
          style={styles.backButton}
        />
        <GlassButton
          title={loading ? "Guardando..." : "Finalizar"}
          onPress={handleFinish}
          variant="primary"
          style={styles.nextButtonSmall}
        />
      </View>
    </View>
  );

  return (
    <AuthLayout>
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              style={[
                styles.progressDot,
                step === currentStep && styles.progressDotActive,
                step < currentStep && styles.progressDotCompleted
              ]}
            />
          ))}
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.glass.border,
  },
  progressDotActive: {
    width: 24,
    backgroundColor: Colors.accent,
  },
  progressDotCompleted: {
    backgroundColor: Colors.accent,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  positionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 40,
  },
  formCard: {
    marginBottom: 30,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
    marginBottom: 12,
    marginTop: 20,
  },
  levelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  levelOptionSelected: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: Colors.accent,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  levelTitleSelected: {
    color: Colors.accent,
  },
  levelDescription: {
    fontSize: 14,
    color: Colors.text.muted,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.glass.border,
  },
  radioSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent,
  },
  objectiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.background,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  objectiveCardSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  objectiveIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  objectiveContent: {
    flex: 1,
  },
  objectiveTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  objectiveTitleSelected: {
    color: Colors.primary,
  },
  objectiveDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  objectiveDescriptionSelected: {
    color: Colors.primary,
    opacity: 0.8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flex: 0.45,
  },
  nextButton: {
    marginTop: 20,
  },
  nextButtonSmall: {
    flex: 0.45,
  },
});

// Importar TouchableOpacity que faltaba
import { TouchableOpacity } from 'react-native';

export default ProfileSetupScreen;