export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'dead';

/**
 * Webhook interface (without secret for API responses)
 */
export interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  description: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Webhook interface with secret (used internally, never exposed via API)
 */
export interface WebhookWithSecret extends Webhook {
  secret: string;
}

/**
 * Webhook with delivery summary stats
 */
export interface WebhookWithStats extends Webhook {
  stats: WebhookStats;
}

/**
 * Webhook delivery stats
 */
export interface WebhookStats {
  totalDeliveries: number;
  successCount: number;
  failureCount: number;
  deadCount: number;
  lastDeliveryAt: Date | null;
  successRate: number;
}

/**
 * Webhook delivery record
 */
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: WebhookEventEnvelope;
  status: WebhookDeliveryStatus;
  attempt_count: number;
  next_retry_at: Date | null;
  last_response_status: number | null;
  last_response_body: string | null;
  last_error: string | null;
  delivered_at: Date | null;
  created_at: Date;
}

/**
 * Webhook event envelope
 */
export interface WebhookEventEnvelope {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
}

/**
 * Input for creating a webhook
 */
export interface CreateWebhookInput {
  url: string;
  events: string[];
  description?: string;
  secret?: string;
}

/**
 * Result of creating a webhook - includes the secret (returned only once)
 */
export interface CreateWebhookResult {
  webhook: Webhook;
  secret: string;
}

/**
 * Input for updating a webhook
 */
export interface UpdateWebhookInput {
  url?: string;
  events?: string[];
  description?: string;
  is_active?: boolean;
}

/**
 * Webhook delivery job for Redis queue
 */
export interface WebhookDeliveryJob {
  deliveryId: string;
  webhookId: string;
  tenantSchema: string;
}

/**
 * Webhook test result
 */
export interface WebhookTestResult {
  success: boolean;
  statusCode: number | null;
  responseBody: string | null;
  error: string | null;
  latencyMs: number;
}
