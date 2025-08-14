import { supabase } from '../config/supabase';

export interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  duration: number;
  category: 'technique' | 'physical' | 'tactical' | 'mental' | 'nutrition';
  category_id: string | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  position: string[] | null;
  is_premium: boolean;
  tags: string[] | null;
  view_count: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface VideoCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order_index: number;
  created_at: string;
}

export interface VideoWithCategory extends Video {
  video_categories: VideoCategory | null;
}

export interface VideoProgress {
  id: string;
  user_id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
  completed_at: string | null;
  last_watched_at: string;
  notes: string | null;
  rating: number | null;
}

/**
 * Utilidad interna para normalizar rutas del bucket 'videos'.
 * - Elimina espacios y slashes iniciales.
 * - Tolera rutas con prefijo 'videos/...', removiéndolo.
 */
const normalizeStoragePath = (input: string): string => {
  if (!input) return '';
  try {
    let raw = String(input).trim();
    if (!raw) return '';

    // Si es URL completa, extraer pathname y decodificar
    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        raw = u.pathname || '';
      } catch {
        // Mantener raw tal cual si falla el parseo
      }
    }

    // Decodificar caracteres URL si es posible
    try {
      raw = decodeURIComponent(raw);
    } catch {
      // Ignorar errores de decodificación
    }

    // Normalizar a forward slashes
    let p = raw.replace(/\\/g, '/');

    // Intentar extraer lo que va después de "/videos/"
    const lower = p.toLowerCase();
    const marker = '/videos/';
    const idx = lower.indexOf(marker);
    if (idx >= 0) {
      p = p.slice(idx + marker.length);
    } else {
      // Fallback: eliminar solo slashes iniciales
      p = p.replace(/^\/+/, '');
    }

    // Remover prefijos comunes
    p = p.replace(/^public\//i, '');
    p = p.replace(/^videos\//i, '');

    // Limpiar slashes iniciales y colapsar dobles slashes
    p = p.replace(/^\/+/, '').replace(/\/{2,}/g, '/').trim();

    return p;
  } catch {
    // Fallback defensivo
    return String(input || '')
      .trim()
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/^public\//i, '')
      .replace(/^videos\//i, '')
      .replace(/\/{2,}/g, '/');
  }
};

/**
 * Crea una URL firmada para un thumbnail almacenado en el bucket privado 'videos'.
 * No expone el bucket públicamente.
 */
export async function getThumbnailUrl(path: string, expirySeconds = 3600): Promise<string | null> {
  const originalPath = path;
  const normalizedPath = normalizeStoragePath(path);
  if (!normalizedPath) return null;

  try {
    const { data, error } = await supabase.storage
      .from('videos')
      .createSignedUrl(normalizedPath, expirySeconds);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }

    // Reintento: si inicia con "public/", probar sin ese prefijo
    let retryPath: string | null = null;
    if (/^public\//i.test(normalizedPath)) {
      retryPath = normalizedPath.replace(/^public\//i, '');
    }

    if (retryPath) {
      const { data: data2, error: error2 } = await supabase.storage
        .from('videos')
        .createSignedUrl(retryPath, expirySeconds);

      if (!error2 && data2?.signedUrl) {
        return data2.signedUrl;
      }

      console.warn('getThumbnailUrl: fallo al firmar thumbnail', {
        originalPath,
        normalizedPath,
        retryPath,
        error: error2 || error
      });
      return null;
    }

    console.warn('getThumbnailUrl: fallo al firmar thumbnail', {
      originalPath,
      normalizedPath,
      error
    });
    return null;
  } catch (err) {
    console.warn('getThumbnailUrl: excepción al firmar thumbnail', {
      originalPath,
      normalizedPath,
      error: err
    });
    return null;
  }
}

class VideosService {
  /**
   * Obtiene todos los videos con sus categorías
   */
  async getAllVideos(): Promise<VideoWithCategory[]> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        video_categories (
          id,
          name,
          slug,
          description,
          icon
        )
      `)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error obteniendo videos:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtiene todos los videos (free + premium) para mostrar en la interfaz
   * Los videos premium tendrán indicadores visuales pero estarán accesibles según suscripción
   */
  async getVideosForUser(userSubscriptionType: 'free' | 'premium' = 'free'): Promise<VideoWithCategory[]> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        video_categories (
          id,
          name,
          slug,
          description,
          icon
        )
      `)
      .order('is_premium', { ascending: true })
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error obteniendo videos para usuario:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtiene videos por categoría
   */
  async getVideosByCategory(categorySlug: string, userSubscriptionType: 'free' | 'premium' = 'free'): Promise<VideoWithCategory[]> {
    let query = supabase
      .from('videos')
      .select(`
        *,
        video_categories (
          id,
          name,
          slug,
          description,
          icon
        )
      `)
      .eq('video_categories.slug', categorySlug)
      .order('order_index', { ascending: true });

    // No filtrar por tipo de suscripción para mostrar videos premium con marca distintiva
    // Los usuarios free verán los videos premium pero no podrán acceder a ellos
    // if (userSubscriptionType === 'free') {
    //   query = query.eq('is_premium', false);
    // }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo videos por categoría:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Obtiene un video específico por ID
   */
  async getVideoById(videoId: string): Promise<VideoWithCategory | null> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        video_categories (
          id,
          name,
          slug,
          description,
          icon
        )
      `)
      .eq('id', videoId)
      .single();

    if (error) {
      console.error('Error obteniendo video por ID:', error);
      return null;
    }

    return data;
  }

  /**
   * Verifica si el usuario tiene acceso a un video
   */
  async canUserAccessVideo(videoId: string, userSubscriptionType: 'free' | 'premium' = 'free'): Promise<boolean> {
    const video = await this.getVideoById(videoId);
    
    if (!video) {
      return false;
    }

    // Si el video es gratuito, todos pueden acceder
    if (!video.is_premium) {
      return true;
    }

    // Si el video es premium, solo usuarios premium pueden acceder
    return userSubscriptionType === 'premium';
  }

  /**
   * Obtiene la URL firmada para acceder al video en Supabase Storage
   */
  async getVideoUrl(videoPath: string): Promise<string | null> {
    try {
      const normalized = normalizeStoragePath(videoPath);
      if (!normalized) return null;
  
      const { data, error } = await supabase.storage
        .from('videos')
        .createSignedUrl(normalized, 3600); // URL válida por 1 hora
  
      if (error) {
        console.error('Error creando URL firmada:', error);
        return null;
      }
  
      return data.signedUrl;
    } catch (error) {
      console.error('Error obteniendo URL de video:', error);
      return null;
    }
  }

  /**
   * Registra o actualiza el progreso de un video para un usuario
   */
  async updateVideoProgress(
    userId: string,
    videoId: string,
    watchedSeconds: number,
    completed: boolean = false
  ): Promise<void> {
    try {
      const progressData = {
        user_id: userId,
        video_id: videoId,
        watched_seconds: watchedSeconds,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        last_watched_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_video_progress')
        .upsert(progressData, {
          onConflict: 'user_id,video_id'
        });

      if (error) {
        console.error('Error actualizando progreso de video:', error);
        throw error;
      }

    } catch (error) {
      console.error('Error en updateVideoProgress:', error);
      throw error;
    }
  }

  /**
   * Obtiene el progreso de un video para un usuario
   */
  async getVideoProgress(userId: string, videoId: string): Promise<VideoProgress | null> {
    const { data, error } = await supabase
      .from('user_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo progreso de video:', error);
      return null;
    }

    return data;
  }

  /**
   * Incrementa estadísticas del usuario
   */

  /**
   * Incrementa el contador de vistas de un video
   */
  async incrementVideoViews(videoId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_video_views', {
        video_id: videoId
      });

      if (error) {
        console.error('Error incrementando vistas de video:', error);
      }
    } catch (error) {
      console.error('Error en incrementVideoViews:', error);
    }
  }

  /**
   * Obtiene todas las categorías de videos
   */
  async getVideoCategories(): Promise<VideoCategory[]> {
    const { data, error } = await supabase
      .from('video_categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error obteniendo categorías de videos:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Califica un video
   */
  async rateVideo(userId: string, videoId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }

    try {
      const { error } = await supabase
        .from('user_video_progress')
        .upsert({
          user_id: userId,
          video_id: videoId,
          rating,
          last_watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        });

      if (error) {
        console.error('Error calificando video:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error en rateVideo:', error);
      throw error;
    }
  }
}

export const videosService = new VideosService();
export default videosService;