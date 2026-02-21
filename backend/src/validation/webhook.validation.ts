import { z } from 'zod';
import { WEBHOOK_EVENTS } from '../config/webhookEvents.js';

/**
 * HTTPS URL refinement
 */
const httpsUrlRefinement = (url: string) => {
  return url.startsWith('https://');
};

/**
 * Create webhook validation schema with HTTPS requirement
 */
export const createWebhookSchema = z.object({
  body: z.object({
    url: z
      .string()
      .url('Invalid URL')
      .max(2048, 'URL must be less than 2048 characters')
      .refine(httpsUrlRefinement, 'Webhook URL must use HTTPS'),
    events: z
      .array(z.enum(WEBHOOK_EVENTS))
      .min(1, 'At least one event type is required')
      .refine(
        (events) => events.length === new Set(events).size,
        'Event types must be unique'
      ),
    description: z
      .string()
      .max(255, 'Description must be less than 255 characters')
      .optional(),
    secret: z
      .string()
      .min(16, 'Secret must be at least 16 characters')
      .max(255, 'Secret must be less than 255 characters')
      .optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Update webhook validation schema
 */
export const updateWebhookSchema = z.object({
  body: z
    .object({
      url: z
        .string()
        .url('Invalid URL')
        .max(2048, 'URL must be less than 2048 characters')
        .refine(httpsUrlRefinement, 'Webhook URL must use HTTPS')
        .optional(),
      events: z
        .array(z.enum(WEBHOOK_EVENTS))
        .min(1, 'At least one event type is required')
        .refine(
          (events) => events.length === new Set(events).size,
          'Event types must be unique'
        )
        .optional(),
      description: z
        .string()
        .max(255, 'Description must be less than 255 characters')
        .optional(),
      is_active: z.boolean().optional(),
    })
    .refine(
      (data) =>
        data.url !== undefined ||
        data.events !== undefined ||
        data.description !== undefined ||
        data.is_active !== undefined,
      { message: 'At least one field must be provided' },
    ),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
  }),
});

/**
 * Get webhook validation schema
 */
export const getWebhookSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
  }),
});

/**
 * Delete webhook validation schema
 */
export const deleteWebhookSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
  }),
});

/**
 * List webhooks validation schema with pagination and filters
 */
export const listWebhooksSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
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
 * List webhook deliveries validation schema
 */
export const listDeliveriesSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    status: z
      .enum(['pending', 'success', 'failed', 'dead'])
      .optional(),
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
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
  }),
});

/**
 * Get webhook delivery validation schema
 */
export const getDeliverySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
    deliveryId: z.string().uuid('Invalid delivery ID'),
  }),
});

/**
 * Redeliver webhook delivery validation schema
 */
export const redeliverDeliverySchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
    deliveryId: z.string().uuid('Invalid delivery ID'),
  }),
});

/**
 * Test webhook validation schema
 */
export const testWebhookSchema = z.object({
  body: z.object({
    eventType: z
      .string()
      .min(1, 'Event type is required')
      .max(100, 'Event type must be less than 100 characters'),
    payload: z.record(z.unknown()).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
  }),
});

/**
 * List dead letters validation schema
 */
export const listDeadLettersSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

/**
 * Redeliver dead letter validation schema
 */
export const redeliverDeadLetterSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    deliveryId: z.string().uuid('Invalid delivery ID'),
  }),
});
