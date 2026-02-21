import { z } from 'zod';

export const createWebhookSchema = z.object({
  body: z.object({
    url: z
      .string()
      .url('Invalid URL')
      .max(2048, 'URL must be less than 2048 characters'),
    events: z
      .array(z.string().min(1).max(100))
      .min(1, 'At least one event type is required'),
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

export const updateWebhookSchema = z.object({
  body: z
    .object({
      url: z
        .string()
        .url('Invalid URL')
        .max(2048, 'URL must be less than 2048 characters')
        .optional(),
      events: z
        .array(z.string().min(1).max(100))
        .min(1, 'At least one event type is required')
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

export const getWebhookSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
  }),
});

export const deleteWebhookSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    webhookId: z.string().uuid('Invalid webhook ID'),
  }),
});

export const listWebhooksSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listDeadLettersSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const redeliverDeadLetterSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    deliveryId: z.string().uuid('Invalid delivery ID'),
  }),
});
