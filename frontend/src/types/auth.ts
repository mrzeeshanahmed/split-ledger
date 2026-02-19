/**
 * Authentication Types
 *
 * Type definitions for the authentication system.
 */

/**
 * User model
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordData {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordData {
  token: string;
  password: string;
}

/**
 * Auth response from API
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

/**
 * API error response
 */
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

/**
 * Password criteria
 */
export interface PasswordCriteria {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}
