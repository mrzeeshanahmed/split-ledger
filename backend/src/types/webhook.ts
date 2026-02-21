export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'dead';

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  description: string | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

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

export interface WebhookEventEnvelope {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
}

export interface CreateWebhookInput {
  url: string;
  secret?: string;
  events: string[];
  description?: string;
}

export interface UpdateWebhookInput {
  url?: string;
  events?: string[];
  description?: string;
  is_active?: boolean;
}

export interface WebhookDeliveryJob {
  deliveryId: string;
  webhookId: string;
  tenantSchema: string;
}
