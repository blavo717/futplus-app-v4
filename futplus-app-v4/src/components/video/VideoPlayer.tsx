import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { videosService, VideoWithCategory } from '../../services/videosService';

// Lista de iconos válidos de Ionicons
const VALID_IONICONS = [
  'alert-circle',
  'star',
  'pause',
  'play',
  'contract',
  'expand',
  'close',
  'time',
  'trending-up',
  'help-outline', // Icono fallback
] as const;

type ValidIconName = typeof VALID_IONICONS[number];

// Función para validar iconos y devolver un fallback si no es válido
const getValidIcon = (iconName: string | null | undefined): ValidIconName => {
  if (!iconName) return 'help-outline';
  return VALID_IONICONS.includes(iconName as ValidIconName) ? (iconName as ValidIconName) : 'help-outline';
};

const { width } = Dimensions.get('window');
const PLAYER_HEIGHT = (width * 9) / 16; // Aspect ratio 16:9

interface VideoPlayerProps {
  video: VideoWithCategory;
  userSubscriptionType: 'free' | 'premium';
  userId?: string;
  onClose?: () => void;
  autoPlay?: boolean;
  disableFullscreen?: boolean;
}

interface PlaybackProgress {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLoaded: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  userSubscriptionType,
  userId,
  onClose,
  autoPlay = false,
  disableFullscreen = false
}) => {
  // Un único ref al video
  const videoRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<PlaybackProgress>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    isLoaded: false
  });
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado fullscreen nativo
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Compuertas: evitan duplicar eventos de vista y progreso
  const hasIncrementedView = useRef(false); // Evita incrementar vistas más de una vez en la primera reproducción
  const lastSentProgressSecond = useRef<number | null>(null); // Evita múltiples upserts en el mismo segundo
  // Refs para control de orientación (no estados visuales)
  const ScreenOrientationRef = useRef<any | null>(null); // soporte opcional sin dependencia obligatoria
  const isLoadedRef = useRef(false); // estado de carga del video (para gating)
  const isPlayingRef = useRef(false); // estado de reproducción (opcional)
  
  useEffect(() => {
    loadVideo();
  }, [video.id]);

  useEffect(() => {
    // Auto-ocultar controles después de 3 segundos
    if (showControls && progress.isPlaying) {
      const timer = setTimeout(() => setShowControls(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls, progress.isPlaying]);

  const loadVideo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar acceso al video
      const hasAccess = await videosService.canUserAccessVideo(
        video.id,
        userSubscriptionType
      );

      if (!hasAccess) {
        setError('Este video requiere suscripción Premium');
        setIsLoading(false);
        return;
      }

      // Obtener URL firmada del video
      const signedUrl = await videosService.getVideoUrl(video.video_url);
      
      if (!signedUrl) {
        setError('No se pudo cargar el video');
        setIsLoading(false);
        return;
      }

      setVideoUrl(signedUrl);
      
    } catch (error) {
      console.error('Error cargando video:', error);
      setError('Error al cargar el video');
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      // Sincroniza refs para gating
      isLoadedRef.current = true;
      isPlayingRef.current = status.isPlaying || false;

      setProgress({
        currentTime: status.positionMillis || 0,
        duration: status.durationMillis || 0,
        isPlaying: status.isPlaying || false,
        isLoaded: true
      });

      setIsLoading(false);

      // Incrementar vistas una única vez al iniciar reproducción real
      if (status.isPlaying && !hasIncrementedView.current && userId) {
        videosService.incrementVideoViews(video.id).catch(console.error);
        hasIncrementedView.current = true;
      }

      // Enviar progreso con throttle cada 10s (un envío por segundo múltiplo de 10)
      if (status.positionMillis != null && status.durationMillis != null && userId) {
        const watchedSeconds = Math.floor(status.positionMillis / 1000);
        const totalSeconds = Math.floor(status.durationMillis / 1000);
        const isCompleted = watchedSeconds >= totalSeconds * 0.9;

        if (watchedSeconds % 10 === 0 && lastSentProgressSecond.current !== watchedSeconds) {
          lastSentProgressSecond.current = watchedSeconds;
          videosService
            .updateVideoProgress(userId, video.id, watchedSeconds, isCompleted)
            .catch(console.error);
        }
      }
    } else {
      // Si no está cargado, evita entradas a fullscreen
      isLoadedRef.current = false;

      if ((status as any)?.error) {
        console.error('Error de reproducción:', (status as any).error);
        setError('Error durante la reproducción');
      }
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (progress.isPlaying) {
        await videoRef.current.pauseAsync?.();
      } else {
        await videoRef.current.playAsync?.();
      }
    } catch (error) {
      console.error('Error controlando reproducción:', error);
    }
  };

  const seekTo = async (position: number) => {
    if (!videoRef.current || !progress.isLoaded) return;

    try {
      await videoRef.current.setPositionAsync?.(position);
    } catch (error) {
      console.error('Error en seek:', error);
    }
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayerPress = () => {
    setShowControls(!showControls);
  };

  // Toggle de fullscreen nativo (present/dismiss) con protección
  async function onToggleFullscreen() {
    try {
      if (!isLoadedRef.current) return; // seguridad: solo si cargado

      if (!isFullscreen) {
        await videoRef.current?.presentFullscreenPlayer?.();
        // Opcional: intentar bloquear a LANDSCAPE si está disponible
        ScreenOrientationRef.current
          ?.lockAsync?.(ScreenOrientationRef.current?.OrientationLock?.LANDSCAPE)
          ?.catch(() => {});
      } else {
        await videoRef.current?.dismissFullscreenPlayer?.();
        // Opcional: volver a PORTRAIT_UP
        ScreenOrientationRef.current
          ?.lockAsync?.(ScreenOrientationRef.current?.OrientationLock?.PORTRAIT_UP)
          ?.catch(() => {});
      }
    } catch (e) {
      console.warn('onToggleFullscreen error', e);
    }
  }

  // Orientación: desbloquear durante la vista del reproductor; bloqueo a PORTRAIT al desmontar
  useEffect(() => {
    // Soporte opcional de expo-screen-orientation sin añadir dependencia
    try {
      ScreenOrientationRef.current = require('expo-screen-orientation');
      ScreenOrientationRef.current?.unlockAsync?.().catch(() => {});
    } catch (_) {
      ScreenOrientationRef.current = null;
    }
  
    return () => {
      ScreenOrientationRef.current
        ?.lockAsync?.(ScreenOrientationRef.current?.OrientationLock?.PORTRAIT_UP)
        ?.catch(() => {});
    };
  }, []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name={getValidIcon("alert-circle")} size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        {video.is_premium && userSubscriptionType === 'free' && (
          <TouchableOpacity style={styles.upgradeButton}>
            <LinearGradient
              colors={['#F59E0B', '#F97316']}
              style={styles.upgradeGradient}
            >
              <Ionicons name={getValidIcon("star")} size={20} color="#FFFFFF" />
              <Text style={styles.upgradeText}>Actualizar a Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        {videoUrl ? (
          <TouchableOpacity
            style={styles.videoWrapper}
            activeOpacity={1}
            onPress={handlePlayerPress}
          >
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri: videoUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={autoPlay}
              isLooping={false}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              onFullscreenUpdate={(event) => {
                const u = (event as any)?.fullscreenUpdate;
                // 0: willPresent, 1: didPresent, 2: willDismiss, 3: didDismiss
                if (u === 1) setIsFullscreen(true);
                if (u === 3) setIsFullscreen(false);
              }}
            />

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Cargando video...</Text>
              </View>
            )}

            {showControls && progress.isLoaded && (
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.controlsOverlay}
              >
                <View style={styles.controls}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlayPause}
                  >
                    <Ionicons
                      name={getValidIcon(progress.isPlaying ? 'pause' : 'play')}
                      size={32}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <View style={styles.progressContainer}>
                    <Text style={styles.timeText}>
                      {formatTime(progress.currentTime)}
                    </Text>

                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: progress.duration > 0
                                ? `${(progress.currentTime / progress.duration) * 100}%`
                                : '0%'
                            }
                          ]}
                        />
                      </View>
                    </View>

                    <Text style={styles.timeText}>
                      {formatTime(progress.duration)}
                    </Text>
                  </View>

                  {!disableFullscreen && (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={onToggleFullscreen}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 18 }}>{isFullscreen ? '⤢' : '⤡'}</Text>
                    </TouchableOpacity>
                  )}

                  {onClose && (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={onClose}
                    >
                      <Ionicons name={getValidIcon("close")} size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Preparando video...</Text>
          </View>
        )}
      </View>

      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{video.title}</Text>
        {video.description && (
          <Text style={styles.videoDescription}>{video.description}</Text>
        )}
        
        <View style={styles.videoMeta}>
          <View style={styles.metaItem}>
            <Ionicons name={getValidIcon("time")} size={16} color={Colors.text.secondary} />
            <Text style={styles.metaText}>
              {Math.floor(video.duration / 60)} min
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name={getValidIcon("trending-up")} size={16} color={Colors.text.secondary} />
            <Text style={styles.metaText}>{video.level}</Text>
          </View>
          
          {video.is_premium && (
            <View style={styles.metaItem}>
              <Ionicons name={getValidIcon("star")} size={16} color="#F59E0B" />
              <Text style={[styles.metaText, { color: '#F59E0B' }]}>
                Premium
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  playerContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    aspectRatio: 16/9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    height: PLAYER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    padding: 8,
  },
  controlButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
  },
  progressBar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  errorContainer: {
    height: PLAYER_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
  },
  errorText: {
    color: Colors.text.primary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  videoInfo: {
    padding: 20,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
});

export default VideoPlayer;