// Tipos de categorías (tabla: video_categories)
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null; // Emoji almacenado en BD
  order_index: number;
  created_at: string;
}