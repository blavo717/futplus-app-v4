import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import PlanItemCard from '../components/training/PlanItemCard';
import useTodayPlan from '../hooks/useTodayPlan';
import GradientBackground from '../components/common/GradientBackground';
import VideoOverlayCard from '../components/video/VideoOverlayCard';
import PlannerBottomSheet from '../components/training/PlannerBottomSheet';
import { useNavigation } from '@react-navigation/native';
import TodayPlanList from '../components/training/TodayPlanList';
import { useNextResetCountdown } from '../hooks/useNextResetCountdown';
import { Colors } from '../constants/colors';
import { videosService, VideoWithCategory, getThumbnailUrl } from '../services/videosService';
import { useAuth } from '../contexts/AuthContext';
import trainingAnalyticsService from '../services/trainingAnalyticsService';
import { useUserData } from '../hooks/useUserData';
import { Category } from '../types/category.types';
import { categoriesService } from '../services/categoriesService';
// Lista de iconos válidos de Ionicons
const VALID_IONICONS = [
  'grid-outline',
  'football-outline',
  'fitness-outline',
  'people-outline',
  'bulb-outline',
  'play',
  'diamond',
  'lock-closed',
  'videocam-outline',
  'help-outline', // Icono fallback
  // Agregar más iconos válidos según sea necesario
] as const;

type ValidIconName = typeof VALID_IONICONS[number];

// Función para validar iconos y devolver un fallback si no es válido
const getValidIcon = (iconName: string | null | undefined): ValidIconName => {
  if (!iconName) return 'help-outline';
  return VALID_IONICONS.includes(iconName as ValidIconName) ? iconName as ValidIconName : 'help-outline';
};

const normalize = (s?: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function getCategoryEmoji(name?: string, providedEmoji?: string): string {
  if (providedEmoji && providedEmoji !== '?' && providedEmoji.trim() !== '') return providedEmoji;
  const n = normalize(name);
  const map: Record<string, string> = {
    fuerza: '💪',
    cardio: '🏃',
    movilidad: '🧘',
    tecnica: '⚽',
    tactico: '🎯',
    calentamiento: '🔥',
    resistencia: '🏋️',
    piernas: '🦵',
    core: '🧱',
    equilibrio: '🤸',
    velocidad: '⚡',
    agilidad: '🌀',
    potencia: '🚀',
    'tren superior': '💪',
    'tren inferior': '🦵',
    estiramientos: '🧘',
    recuperacion: '🛟',
    portero: '🧤',
    tiro: '🥅',
    pases: '🎯',
    regate: '🌀',
    coordinacion: '🧩',
    // slugs/inglés comunes
    technique: '⚽',
    physical: '🏋️',
    tactical: '🎯',
    mental: '🧠',
    nutrition: '🍎',
    all: '🏷️',
    todos: '🏷️',
  };
  return map[n] || '🏷️';
}

// Fallback de iconos por slug (normalizados) - mapping requerido por alcance
// Físico=💪, Táctico=🧠, Mental=🎯, Técnica=⚽, Nutrición=🧁
const CATEGORY_ICON_FALLBACK: Record<string, string> = {
  // slugs en español
  fisico: '💪',
  tactico: '🧠',
  mental: '🎯',
  tecnica: '⚽',
  nutricion: '🧁',
  // equivalentes en inglés
  physical: '💪',
  tactical: '🧠',
  technique: '⚽',
  nutrition: '🧁',
  // genéricos
  all: '🏷️',
  todos: '🏷️',
};

/**
 * Resuelve el icono a mostrar para una categoría a partir de:
 * 1) icon de BD (emoji), si existe y no es vacío
 * 2) Fallback local por slug normalizado (o por nombre si no hay slug)
 * 3) '🏷️' como último recurso
 */
function getCategoryIconFromData(
  iconFromDb?: string | null,
  slug?: string,
  name?: string
): string {
  if (iconFromDb && iconFromDb.trim() !== '') {
    return iconFromDb;
  }
  const key = normalize(slug || name);
  if (!key) return '🏷️';
  return CATEGORY_ICON_FALLBACK[key] || '🏷️';
}

interface CategoryOption extends Category {
  gradient: readonly [string, string, ...string[]];
}

const defaultCategories: CategoryOption[] = [
  {
    id: 'all',
    name: 'Todos',
    slug: 'all',
    description: null,
    icon: '🏷️',
    order_index: 0,
    created_at: '',
    gradient: ['#6366F1', '#8B5CF6'] as const
  },
  {
    id: 'technique',
    name: 'Técnica',
    slug: 'technique',
    description: null,
    icon: '⚽',
    order_index: 1,
    created_at: '',
    gradient: ['#EF4444', '#F97316'] as const
  },
  {
    id: 'physical',
    name: 'Físico',
    slug: 'physical',
    description: null,
    icon: '💪',
    order_index: 2,
    created_at: '',
    gradient: ['#10B981', '#06B6D4'] as const
  },
  {
    id: 'tactical',
    name: 'Táctico',
    slug: 'tactical',
    description: null,
    icon: '🧠',
    order_index: 3,
    created_at: '',
    gradient: ['#8B5CF6', '#A855F7'] as const
  },
  {
    id: 'mental',
    name: 'Mental',
    slug: 'mental',
    description: null,
    icon: '🎯',
    order_index: 4,
    created_at: '',
    gradient: ['#F59E0B', '#F97316'] as const
  }
];
 
type VideoWithSignedThumb = VideoWithCategory & { thumbnail_signed_url?: string | null };

const FALLBACK_GRADIENT = ['#6366F1', '#8B5CF6'] as const;

function EntrenamientoScreen() {
  const { user } = useAuth();
  const { profile, progress } = useUserData();
  const navigation = useNavigation<any>();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [videos, setVideos] = useState<VideoWithSignedThumb[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithCategory | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const { plan, items: todayItems, summary, isWorking, isEnsuring, markSetCompleted, markItemCompleted, updateItemSetsTotal, refresh, ensureTodayPlanIfEmpty } = useTodayPlan();
  const [plannerVisible, setPlannerVisible] = useState(false);
  const [plannerMode, setPlannerMode] = useState<'plan' | 'edit'>('plan');
  const [showAllPlan, setShowAllPlan] = useState(false);
  const hasPlan = todayItems.length > 0 || ((summary?.total_items ?? 0) > 0);

  // Derivar flag desde summary (fuente de verdad: useTodayPlan)
  // isAllCompletedToday = summary.items_completed >= summary.total_items
  const isAllCompletedToday = !!summary?.total_items && (summary.items_completed >= summary.total_items);

  const openPlanner = (m: 'plan' | 'edit') => { setPlannerMode(m); setPlannerVisible(true); };
  const closePlanner = async () => {
    setPlannerVisible(false);
    await refresh();
  };
  const handleStartTraining = () => {
    // Si el plan de hoy está completado, no permitir iniciar la sesión
    if (isAllCompletedToday) {
      console.debug('analytics: training_session_start_click_blocked_completed', { completed: true });
      return;
    }

    if (hasPlan) {
      console.debug('analytics: training_session_start_click', { completed: false, hasPlan: true });
      navigation.navigate('EntrenamientoSession' as never);
    } else {
      console.debug('analytics: training_planner_open_from_cta', { reason: 'no_plan' });
      openPlanner('plan');
    }
  };

  // CTA premium bloqueado: advertencia si usuario free
  const handlePremiumContinue = () => {
    console.debug('analytics: premium_continue_click', { source: 'training_completed_cta' });
    // Analítica en Supabase
    trainingAnalyticsService.recordPremiumBlock(user?.id ?? null, { source: 'continue_cta' }).catch(() => {});
    if (userSubscriptionType === 'free') {
      Alert.alert(
        '🎯 Contenido Premium',
        'Esta función forma parte de nuestro contenido premium. Actualiza tu suscripción para acceder a entrenamientos exclusivos y técnicas avanzadas.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Ver Planes',
            onPress: () => {
              console.debug('analytics: navigate_to_plans_from_premium_cta', { source: 'training_completed_cta' });
              // TODO: Navegar a la pantalla de suscripciones
              console.log('Navegar a planes premium');
            },
          },
        ]
      );
      return;
    }
    // TODO(premium): flujo para usuarios premium cuando esté disponible
  };


  // Layout responsivo para grid 2 columnas
  const { width } = useWindowDimensions();
  const SPACING = 12;
  const H_PADDING = 16;
  const cardWidth = Math.floor((width - H_PADDING * 2 - SPACING) / 2);

  // Estado de pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  // Control de errores de carga de thumbnails para fallback a gradiente
  const [imageErrorIds, setImageErrorIds] = useState<Set<string>>(new Set());
  
  
    // Determinar el tipo de suscripción del usuario
    // TODO: Implementar la lógica real para obtener el tipo de suscripción del usuario
    const getUserSubscriptionType = (): 'free' | 'premium' => {
      // Por ahora todos los usuarios son gratuitos - TODO: actualizar cuando se corrijan los tipos
      // Esta función debería determinar el tipo de suscripción basándose en:
      // - Una tabla de suscripciones en la base de datos
      // - Una propiedad en el perfil del usuario
      // - Una función RPC que verifique el estado de suscripción
      return 'free';
    };
    
    const userSubscriptionType = getUserSubscriptionType();
  useEffect(() => {
    loadVideosAndCategories();
  }, []);
  
  // Autogeneración silenciosa si no hay plan
  useEffect(() => {
    ensureTodayPlanIfEmpty();
  }, [ensureTodayPlanIfEmpty]);

  // Cuenta atrás hasta el próximo reinicio diario (00:00 hora local, equivalente España si dispositivo está en esa TZ)
  const dayZeroOffsetHours = 0;
  const { formatted: resetFormatted, isElapsed } = useNextResetCountdown(dayZeroOffsetHours);

  // Cuando llega el reinicio, refrescar/resincronizar para re-habilitar CTA y autogenerar nuevo plan
  useEffect(() => {
    if (isElapsed) {
      console.debug('analytics: app_day_reset_reached', { scope: 'training' });
      (async () => {
        await refresh();
        await ensureTodayPlanIfEmpty();
      })();
    }
  }, [isElapsed, refresh, ensureTodayPlanIfEmpty]);

  const loadVideosAndCategories = async (isRefresh: boolean = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setCategoriesError(null);

      // Cargar videos para el usuario
      const videosData = await videosService.getVideosForUser(userSubscriptionType);

      // Firmar thumbnails en paralelo
      const signed = await Promise.all(
        videosData.map(async (v) => ({
          ...v,
          thumbnail_signed_url: v.thumbnail_url ? await getThumbnailUrl(v.thumbnail_url) : null,
        }))
      );

      setVideos(signed as VideoWithSignedThumb[]);

      // Cargar categorías reales
      const categoriesData = await categoriesService.getCategories();
      if (!categoriesData || categoriesData.length === 0) {
        console.warn('Categorías: consulta vacía desde Supabase');
      }

      // Combinar categorías reales con gradientes predeterminados
      const categoriesWithGradients: CategoryOption[] = [
        defaultCategories[0], // "Todos"
        ...categoriesData.map((cat, index) => ({
          ...cat,
          gradient: defaultCategories[index + 1]?.gradient ?? FALLBACK_GRADIENT
        }))
      ];

      setCategories(categoriesWithGradients);
    } catch (error) {
      console.error('Error cargando datos:', error);
      console.warn('Fallo al consultar categorías de Supabase en EntrenamientoScreen:', error);
      setCategoriesError('No se pudieron cargar categorías');
      // Mantener al menos el chip "Todos"
      setCategories([defaultCategories[0]]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const filteredVideos = selectedCategory === 'all'
    ? videos
    : videos.filter(video =>
        video.category === selectedCategory ||
        video.video_categories?.slug === selectedCategory
      );

  const getDifficultyStyle = (level: string) => {
    switch (level) {
      case 'beginner':
        return { backgroundColor: '#10B981' };
      case 'intermediate':
        return { backgroundColor: '#F59E0B' };
      case 'advanced':
        return { backgroundColor: '#EF4444' };
      default:
        return { backgroundColor: '#6B7280' };
    }
  };

  const getDifficultyText = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return 'Todos';
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    loadVideosAndCategories(true);
  };

  const openOverlay = (video: VideoWithCategory) => {
    // Verificar si el usuario puede acceder al video
    if (video.is_premium && userSubscriptionType === 'free') {
      Alert.alert(
        '🎯 Contenido Premium',
        'Este video forma parte de nuestro contenido premium. Actualiza tu suscripción para acceder a entrenamientos exclusivos y técnicas avanzadas.',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Ver Planes',
            onPress: () => {
              // TODO: Navegar a la pantalla de suscripciones
              console.log('Navegar a planes premium');
            },
          },
        ]
      );
      return;
    }

    setSelectedVideo(video);
    setOverlayVisible(true);
  };

  const closeOverlay = () => {
    setOverlayVisible(false);
    setSelectedVideo(null);
  };

  const renderVideoCard = ({ item }: { item: VideoWithSignedThumb }) => (
    <TouchableOpacity
      style={[styles.videoCard, { width: cardWidth, marginBottom: SPACING }]}
      onPress={() => openOverlay(item)}
    >
      <View style={[styles.thumbnailContainer, hasPlan && { height: 100 }]}>
        <LinearGradient
          colors={['#1F2937', '#374151']}
          style={styles.thumbnailGradient}
        />

        {item.thumbnail_signed_url && !imageErrorIds.has(item.id) && (
          <Image
            source={{ uri: item.thumbnail_signed_url }}
            style={styles.thumbnailImage}
            resizeMode="cover"
            onError={() => {
              setImageErrorIds((prev) => {
                const next = new Set(prev);
                next.add(item.id);
                return next;
              });
            }}
          />
        )}

        <View style={styles.playOverlay}>
          <Ionicons name={getValidIcon("play")} size={32} color="#FFFFFF" />
        </View>
        
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
        </View>
        
        {item.is_premium && (
          <View style={styles.premiumBadge}>
            <Ionicons name={getValidIcon("diamond")} size={12} color="#FFFFFF" />
            <Text style={styles.premiumText}>Premium</Text>
          </View>
        )}
        
        {item.is_premium && userSubscriptionType === 'free' && (
          <View style={styles.premiumOverlay}>
            <Ionicons name={getValidIcon("lock-closed")} size={24} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.videoMeta}>
          <View style={[styles.difficultyBadge, getDifficultyStyle(item.level)]}>
            <Text style={[styles.difficultyText, { color: '#FFFFFF' }]}>
              {getDifficultyText(item.level)}
            </Text>
          </View>
          
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {getCategoryIconFromData(
                item.video_categories?.icon,
                item.video_categories?.slug || item.category,
                item.video_categories?.name || item.category
              )}{' '}
              {item.video_categories?.name || item.category}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryChip = ({ item }: { item: CategoryOption }) => {
    const isActive = selectedCategory === item.id || selectedCategory === item.slug;
    
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isActive && styles.activeCategoryChip]}
        onPress={() => setSelectedCategory(item.slug)}
      >
        <LinearGradient
          colors={isActive ? item.gradient : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.categoryGradient}
        >
          <View style={styles.categoryContent}>
            <Text style={styles.categoryEmoji}>
              {getCategoryIconFromData(item.icon, item.slug, item.name)}
            </Text>
            <Text
              style={[
                styles.categoryName,
                isActive && styles.activeCategoryName
              ]}
            >
              {item.name}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientBackground />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando videos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVideos}
          renderItem={renderVideoCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 16, paddingTop: 8 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <View style={styles.header}>
                <Text style={styles.title}>Entrenamientos</Text>
                <Text style={styles.subtitle}>
                  Descubre rutinas personalizadas para alcanzar tus objetivos
                </Text>
              </View>

              <View style={styles.progressOverview}>
                <TodayPlanList
                  items={todayItems}
                  summary={summary}
                  loading={isWorking}
                  isEnsuring={isEnsuring}
                />

                {isAllCompletedToday ? (
                  <>
                    {/* Botón premium bloqueado para continuar con más entrenamientos */}
                    <TouchableOpacity
                      accessibilityLabel="Seguir con más entrenamientos (Premium bloqueado)"
                      style={[styles.startBtn, { marginHorizontal: 20, position: 'relative' }]}
                      onPress={handlePremiumContinue}
                      testID="continuePremiumLocked"
                    >
                      <LinearGradient colors={Colors.gradient.primary} style={styles.startBtnGradient}>
                        <Text style={styles.startBtnText}>Seguir con más entrenamientos</Text>
                      </LinearGradient>

                      {/* Badge Premium arriba a la derecha */}
                      <View style={[styles.premiumBadge, { top: 8, right: 8, position: 'absolute' }]} pointerEvents="none">
                        <Ionicons name={getValidIcon("diamond")} size={12} color="#FFFFFF" />
                        <Text style={styles.premiumText}>Premium</Text>
                      </View>

                      {/* Overlay oscuro + icono candado centrado */}
                      <View style={[styles.premiumOverlay, { borderRadius: 12 }]} pointerEvents="none">
                        <Ionicons name={getValidIcon("lock-closed")} size={24} color="#FFFFFF" />
                      </View>
                    </TouchableOpacity>

                    {/* Contador hasta que se habilite el nuevo plan */}
                    <TouchableOpacity
                      style={[styles.countdownBtn, { marginHorizontal: 20, marginTop: 8 }]}
                      disabled
                      accessibilityLabel="Nuevo plan disponible en"
                      testID="newPlanCountdown"
                    >
                      <LinearGradient
                        colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                        style={styles.countdownBtnGradient}
                      >
                        <Text style={styles.countdownBtnText}>Nuevo plan en {resetFormatted}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={{ marginHorizontal: 20 }}>
                      <Text style={styles.completedInlineText} testID="todayCompletedInlineMessage">
                        Entrenamiento de hoy completado
                      </Text>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    accessibilityLabel="Comenzar el entrenamiento"
                    accessibilityState={{ disabled: false }}
                    onPress={handleStartTraining}
                    style={[styles.startBtn, { marginHorizontal: 20 }]}
                    testID="startTrainingButton"
                  >
                    <LinearGradient colors={Colors.gradient.primary} style={styles.startBtnGradient}>
                      <Text style={styles.startBtnText}>Comenzar el entrenamiento</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {/* El plan se ejecuta ahora dentro del overlay de sesión; evitamos listar aquí para limpiar la pantalla */}

              <View style={styles.categoriesSection}>
                <Text style={styles.sectionTitle}>Categorías</Text>
                <FlatList
                  horizontal
                  data={categories}
                  renderItem={renderCategoryChip}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesList}
                  ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
                />
              </View>

              <View style={styles.videosSection}>
                <Text style={styles.sectionTitle}>
                  {selectedCategory === 'all'
                    ? 'Todos los entrenamientos'
                    : categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory)?.name}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name={getValidIcon("videocam-outline")} size={48} color={Colors.text.secondary} />
              <Text style={styles.emptyText}>
                {selectedCategory === 'all'
                  ? 'No hay videos disponibles'
                  : 'No hay videos en esta categoría'}
              </Text>
              <Text style={styles.emptySubtext}>Los videos se cargarán pronto</Text>
            </View>
          }
        />
      )}

      {/* Overlay de reproducción (card horizontal grande) */}
      {overlayVisible && selectedVideo && (
        <VideoOverlayCard
          video={selectedVideo}
          onClose={closeOverlay}
        />
      )}

      <PlannerBottomSheet
        visible={plannerVisible}
        mode={plannerMode}
        onClose={closePlanner}
      />

      {/* La sesión ahora se realiza en pantalla dedicada: EntrenamientoSession */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    opacity: 0.9,
  },
  progressOverview: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  progressCard: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '500',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categorySeparator: {
    width: 12,
  },
  categoryChip: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeCategoryChip: {
    elevation: 4,
    shadowOpacity: 0.2,
  },
  categoryGradient: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  activeCategoryName: {
    color: Colors.text.primary,
  },
  planSection: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  videosSection: {
    paddingBottom: 32,
  },
  videosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 16,
  },
  videoColumn: {
    // width controlado por cardWidth en renderItem
  },
  videoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  thumbnailContainer: {
    height: 120,
    position: 'relative',
  },
  thumbnailGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    pointerEvents: 'none',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  instructorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 16,
    marginTop: 12,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: Colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaPlanCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  ctaSummary: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  ctaActions: {
    gap: 8,
  },
  ctaActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  ctaBtnPrimary: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderColor: 'rgba(99,102,241,0.6)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  ctaBtnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  ctaBtnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  startBtn: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  startBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  completedInlineText: {
    marginTop: 8,
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  ctaBtnSecondaryText: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  countdownBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  countdownBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  countdownBtnText: {
    color: Colors.text.secondary,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  togglePlanBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  togglePlanText: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default EntrenamientoScreen;
