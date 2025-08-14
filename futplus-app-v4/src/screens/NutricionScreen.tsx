import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/auth/GlassCard';
import GlassButton from '../components/onboarding/GlassButton';
import GradientBackground from '../components/common/GradientBackground';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

interface Meal {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  category: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  completed: boolean;
}

interface MacroProgress {
  label: string;
  value: number;
  target: number;
  color: string;
  unit: string;
}

export default function NutricionScreen() {
  const [meals] = useState<Meal[]>([
    {
      id: '1',
      title: 'Desayuno Power',
      description: 'Avena con frutas rojas y proteína',
      calories: 450,
      protein: 25,
      carbs: 55,
      fat: 12,
      time: '08:00',
      category: 'breakfast',
      completed: true
    },
    {
      id: '2',
      title: 'Almuerzo Balanceado',
      description: 'Pollo a la plancha con arroz integral',
      calories: 650,
      protein: 45,
      carbs: 60,
      fat: 20,
      time: '13:00',
      category: 'lunch',
      completed: true
    },
    {
      id: '3',
      title: 'Snack Energético',
      description: 'Manzana con almendras y yogur',
      calories: 200,
      protein: 8,
      carbs: 25,
      fat: 8,
      time: '16:00',
      category: 'snack',
      completed: false
    },
    {
      id: '4',
      title: 'Cena Ligera',
      description: 'Salmón con verduras al vapor',
      calories: 500,
      protein: 35,
      carbs: 30,
      fat: 25,
      time: '20:00',
      category: 'dinner',
      completed: false
    }
  ]);

  const [macros] = useState<MacroProgress[]>([
    { label: 'Calorías', value: 1100, target: 2800, color: '#FF6B6B', unit: 'kcal' },
    { label: 'Proteínas', value: 70, target: 180, color: '#4ECDC4', unit: 'g' },
    { label: 'Carbos', value: 115, target: 320, color: '#45B7D1', unit: 'g' },
    { label: 'Grasas', value: 32, target: 90, color: '#96CEB4', unit: 'g' }
  ]);

  const [hydration] = useState({ current: 2.5, target: 3.5 });

  const getCategoryGradient = (category: string): [string, string] => {
    switch (category) {
      case 'breakfast':
        return ['#FF6B6B', '#FF8E53'];
      case 'lunch':
        return ['#4ECDC4', '#44A08D'];
      case 'snack':
        return ['#45B7D1', '#96CEB4'];
      case 'dinner':
        return ['#667eea', '#764ba2'];
      default:
        return ['#667eea', '#764ba2'];
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'snack': return '🍎';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  };

  const CircularProgress = ({ value, target, color, size = 80 }: { value: number, target: number, color: string, size?: number }) => {
    const percentage = Math.min((value / target) * 100, 100);
    
    return (
      <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
        <View style={{
          width: size,
          height: size,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            position: 'absolute',
            width: size - 8,
            height: size - 8,
            borderRadius: (size - 8) / 2,
            borderWidth: 4,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }} />
          <View style={{
            position: 'absolute',
            width: size - 8,
            height: size - 8,
            borderRadius: (size - 8) / 2,
            borderWidth: 4,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            transform: [{ rotate: `${(percentage / 100) * 360 - 45}deg` }]
          }} />
          <Text style={styles.circularProgressValue}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    );
  };

  const MealCard = ({ meal }: { meal: Meal }) => {
    const [scaleAnim] = useState(new Animated.Value(1));

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <GlassCard style={styles.mealCard}>
          <TouchableOpacity
            style={styles.mealContent}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={getCategoryGradient(meal.category)}
              style={styles.mealImagePlaceholder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.mealCategoryIcon}>{getCategoryIcon(meal.category)}</Text>
            </LinearGradient>
            
            <View style={styles.mealDetails}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealTitle}>{meal.title}</Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              
              <Text style={styles.mealDescription}>{meal.description}</Text>
              
              <View style={styles.mealMacros}>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroBadgeText}>{meal.calories} kcal</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroBadgeText}>{meal.protein}g P</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroBadgeText}>{meal.carbs}g C</Text>
                </View>
                <View style={styles.macroBadge}>
                  <Text style={styles.macroBadgeText}>{meal.fat}g F</Text>
                </View>
              </View>
            </View>

            <View style={[styles.completionIndicator, meal.completed && styles.completed]}>
              {meal.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Nutrición</Text>
          <Text style={styles.subtitle}>Tu plan alimenticio diario</Text>
        </View>

        {/* Macro Tracking with Circular Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Macros</Text>
          <GlassCard style={styles.macrosCard}>
            <View style={styles.macrosGrid}>
              {macros.map((macro, index) => (
                <View key={index} style={styles.macroItem}>
                  <CircularProgress 
                    value={macro.value} 
                    target={macro.target} 
                    color={macro.color} 
                  />
                  <Text style={styles.macroLabel}>{macro.label}</Text>
                  <Text style={styles.macroValue}>
                    {macro.value}{macro.unit} / {macro.target}{macro.unit}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </View>

        {/* Meal Timeline */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cronograma de Comidas</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver todo</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mealsContainer}>
            {meals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </View>
        </View>

        {/* Hydration Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hidratación</Text>
          <GlassCard style={styles.hydrationCard}>
            <View style={styles.hydrationContent}>
              <View style={styles.hydrationInfo}>
                <Text style={styles.hydrationEmoji}>💧</Text>
                <View>
                  <Text style={styles.hydrationText}>
                    {hydration.current}L / {hydration.target}L
                  </Text>
                  <Text style={styles.hydrationSubtitle}>
                    Objetivo diario de agua
                  </Text>
                </View>
              </View>
              
              <View style={styles.hydrationProgress}>
                <View style={styles.progressBar}>
                  <LinearGradient
                    colors={['#4ECDC4', '#44A08D']}
                    style={[styles.progressFill, { width: `${(hydration.current / hydration.target) * 100}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round((hydration.current / hydration.target) * 100)}%
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionSection}>
          <GlassButton
            title="Registrar Comida"
            onPress={() => {}}
            variant="primary"
            style={styles.actionButton}
          />
          <GlassButton
            title="Ajustar Objetivos"
            onPress={() => {}}
            variant="glass"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    opacity: 0.8,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginLeft: 4,
  },
  seeAllText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '600',
  },
  macrosCard: {
    marginHorizontal: 0,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  macroItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 8,
  },
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  macroLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  macroValue: {
    fontSize: 11,
    color: Colors.text.secondary,
    opacity: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
  mealsContainer: {
    gap: 12,
  },
  mealCard: {
    marginHorizontal: 0,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 20,
  },
  mealContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mealImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mealCategoryIcon: {
    fontSize: 32,
  },
  mealDetails: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  mealTime: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  mealDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
    opacity: 0.9,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  macroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  macroBadgeText: {
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  completionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  completed: {
    backgroundColor: Colors.accent,
  },
  checkmark: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  hydrationCard: {
    marginHorizontal: 0,
    padding: 20,
  },
  hydrationContent: {
    gap: 16,
  },
  hydrationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hydrationEmoji: {
    fontSize: 32,
  },
  hydrationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  hydrationSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    opacity: 0.8,
  },
  hydrationProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  actionSection: {
    marginTop: 8,
    marginBottom: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    marginHorizontal: 0,
  },
});
