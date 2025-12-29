export interface User {
  id: string;
  email: string;
  is_vip: boolean;
  vip_start_time: string | null;
  vip_end_time: string | null;
  vip_level: number;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

export interface AuthResponse extends ApiResponse<User> {}