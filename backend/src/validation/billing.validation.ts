import { z } from 'zod';

export const recordUsageSchema = z.object({
  metric: z.string().min(1, 'Metric is required'),
  quantity: z.number().int().min(0, 'Quantity must be a non-negative integer'),
  unitPriceCents: z.number().int().min(0).optional().default(0),
  metadata: z.record(z.unknown()).optional().default({}),
  recordedAt: z.string().datetime().optional(),
});

export const getUsageQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metric: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('100'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
});

export const runBillingSchema = z.object({
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  dryRun: z.boolean().optional().default(false),
  tenantId: z.string().uuid().optional(),
});

export const reconciliationQuerySchema = z.object({
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/),
  includeStripeData: z.boolean().optional().default(false),
});

export const revenueQuerySchema = z.object({
  billingPeriod: z.string().regex(/^\d{4}-\d{2}$/),
  tenantId: z.string().uuid().optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
});

export type RecordUsageInput = z.infer<typeof recordUsageSchema>;
export type GetUsageQuery = z.infer<typeof getUsageQuerySchema>;
export type RunBillingInput = z.infer<typeof runBillingSchema>;
export type ReconciliationQuery = z.infer<typeof reconciliationQuerySchema>;
export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
