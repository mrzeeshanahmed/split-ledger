import { z } from 'zod';

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address format')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password must be less than 128 characters'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be less than 100 characters')
      .trim(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be less than 100 characters')
      .trim(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Register Tenant validation schema
 */
export const registerTenantSchema = z.object({
  body: z.object({
    workspaceName: z
      .string()
      .min(1, 'Workspace name is required')
      .max(50, 'Workspace name must be less than 50 characters')
      .trim(),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address format')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password must be less than 128 characters'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name must be less than 100 characters')
      .trim(),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name must be less than 100 characters')
      .trim(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address format')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(1, 'Password is required')
      .max(128, 'Password must be less than 128 characters'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address format')
      .toLowerCase()
      .trim(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password must be less than 128 characters'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
