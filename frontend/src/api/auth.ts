import api, { getErrorMessage } from '@/lib/axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  User,
} from '@/types/auth';

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', data);
  return response.data;
}

/**
 * Login user
 */
export async function login(data: LoginCredentials): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
}

/**
 * Logout user
 */
export async function logout(): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/logout');
  return response.data;
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await api.get<{ success: boolean; user: User }>('/auth/me');
    return response.data.user || null;
  } catch {
    return null;
  }
}

/**
 * Request password reset
 */
export async function forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/forgot-password', data);
  return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/reset-password', data);
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/refresh');
  return response.data;
}

export { getErrorMessage };
