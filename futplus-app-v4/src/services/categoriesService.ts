import { supabase } from '../config/supabase';
import { Category } from '../types/category.types';

class CategoriesService {
  /**
   * Obtiene categorías desde Supabase (tabla: video_categories)
   * Columnas: id, name, slug, icon, description, order_index, created_at
   */
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('video_categories')
        .select('id, name, slug, icon, description, order_index, created_at')
        .order('order_index', { ascending: true });

      if (error) {
        console.warn('categoriesService.getCategories: error en consulta', error);
        throw error;
      }

      return (data as Category[]) || [];
    } catch (err) {
      console.warn('categoriesService.getCategories: excepción en consulta', err);
      return [];
    }
  }

  /**
   * Obtiene una categoría por slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('video_categories')
        .select('id, name, slug, icon, description, order_index, created_at')
        .eq('slug', slug)
        .single();

      if (error) {
        // PGRST116 = not found
        if ((error as any).code !== 'PGRST116') {
          console.warn('categoriesService.getCategoryBySlug: error en consulta', { slug, error });
        }
        return null;
      }

      return data as Category;
    } catch (err) {
      console.warn('categoriesService.getCategoryBySlug: excepción en consulta', { slug, err });
      return null;
    }
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;