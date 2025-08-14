export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  position: 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
  age: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  objective: 'technique' | 'fitness' | 'tactics' | 'professional';
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsProfile: boolean;
  emailVerified: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface AuthError {
  message: string;
  code?: string;
}