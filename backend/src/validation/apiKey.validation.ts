import { z } from 'zod';
import { ApiKeyScope } from '../types/apiKey.js';

/**
 * Create API key validation schema
 */
export const createApiKeySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim(),
    scopes: z
      .array(z.enum(['read', 'write', 'admin'] as const))
      .min(1, 'At least one scope is required')
      .default(['read']),
    rateLimitPerMinute: z
      .number()
      .int('Rate limit must be an integer')
      .min(1, 'Rate limit must be at least 1')
      .max(10000, 'Rate limit cannot exceed 10000')
      .optional(),
    rateLimitPerDay: z
      .number()
      .int('Rate limit must be an integer')
      .min(1, 'Rate limit must be at least 1')
      .max(1000000, 'Rate limit cannot exceed 1000000')
      .optional(),
    expiresAt: z.string().datetime().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Revoke API key validation schema
 */
export const revokeApiKeySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    apiKeyId: z.string().uuid('Invalid API key ID'),
  }),
});

/**
 * Get API key validation schema
 */
export const getApiKeySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    apiKeyId: z.string().uuid('Invalid API key ID'),
  }),
});

/**
 * Delete API key validation schema
 */
export const deleteApiKeySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    apiKeyId: z.string().uuid('Invalid API key ID'),
  }),
});

/**
 * List API keys validation schema
 */
export const listApiKeysSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val >= 1, 'Limit must be a positive integer')
      .refine((val) => val <= 1000, 'Limit cannot exceed 1000')
      .optional(),
    offset: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val >= 0, 'Offset must be a non-negative integer')
      .optional(),
  }),
  params: z.object({}).optional(),
});

/**
 * Get API key usage validation schema
 */
export const getApiKeyUsageSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    limit: z
      .string()
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val >= 1, 'Limit must be a positive integer')
      .refine((val) => val <= 1000, 'Limit cannot exceed 1000')
      .optional(),
  }),
  params: z.object({
    apiKeyId: z.string().uuid('Invalid API key ID'),
  }),
});

/**
 * Get API key stats validation schema
 */
export const getApiKeyStatsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    apiKeyId: z.string().uuid('Invalid API key ID'),
  }),
});

/**
 * Update API key validation schema (for future use)
 */
export const updateApiKeySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim()
      .optional(),
    scopes: z
      .array(z.enum(['read', 'write', 'admin'] as const))
      .min(1, 'At least one scope is required')
      .optional(),
    rateLimitPerMinute: z
      .number()
      .int('Rate limit must be an integer')
      .min(1, 'Rate limit must be at least 1')
      .max(10000, 'Rate limit cannot exceed 10000')
      .optional(),
    rateLimitPerDay: z
      .number()
      .int('Rate limit must be an integer')
      .min(1, 'Rate limit must be at least 1')
      .max(1000000, 'Rate limit cannot exceed 1000000')
      .optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    apiKeyId: z.string().uuid('Invalid API key ID'),
  }),
});
