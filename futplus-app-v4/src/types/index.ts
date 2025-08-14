// Tipos principales de la aplicación FutPlus

export interface Usuario {
  id: string;
  email: string;
  nombreCompleto?: string;
  edad?: number;
  posicion?: 'portero' | 'defensa' | 'mediocampista' | 'delantero';
  objetivo?: string;
  planActual: 'gratuito' | 'premium';
  fechaRegistro: Date;
  fotoPerfil?: string;
}

export interface Video {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'tecnica' | 'fisico' | 'tactico';
  duracion: number; // en segundos
  miniatura: string;
  urlVideo: string;
  nivel: 'principiante' | 'intermedio' | 'avanzado';
  premium: boolean;
  vistas: number;
}

export interface PlanNutricional {
  id: string;
  titulo: string;
  descripcion: string;
  comidas: Comida[];
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  premium: boolean;
}

export interface Comida {
  id: string;
  nombre: string;
  tipo: 'desayuno' | 'almuerzo' | 'cena' | 'snack';
  ingredientes: string[];
  instrucciones: string;
  calorias: number;
  imagen?: string;
}

export interface ProgresoUsuario {
  id: string;
  usuarioId: string;
  fecha: Date;
  entrenamientoCompletado: boolean;
  nutricionSeguida: boolean;
  videosVistos: string[];
  notasPersonales?: string;
}