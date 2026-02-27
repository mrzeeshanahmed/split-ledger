export type WebhookStatus = 'pending' | 'delivered' | 'failed' | 'retrying' | 'dead';

export interface Webhook extends Record<string, unknown> {
    id: string;
    url: string;
    events: string[];
    isActive: boolean;
    description?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface WebhookDelivery extends Record<string, unknown> {
    id: string;
    webhookId: string;
    eventType: string;
    payload: Record<string, unknown>;
    status: WebhookStatus;
    attemptCount: number;
    nextRetryAt: string | null;
    lastResponseStatus: number | null;
    lastResponseBody: string | null;
    lastError: string | null;
    deliveredAt: string | null;
    createdAt: string;
}

export interface WebhookStats {
    total: number;
    success: number;
    failed: number;
    dead: number;
    pending: number;
    retrying: number;
}

export interface WebhookWithStats {
    webhook: Webhook;
    stats: WebhookStats;
}

export interface CreateWebhookPayload {
    url: string;
    events: string[];
    description?: string;
    secret?: string; // Optional custom secret, or backend generated
}

export interface CreateWebhookResponse {
    webhook: Webhook;
    secret: string; // One-time secret reveal
}

export interface UpdateWebhookPayload {
    url?: string;
    events?: string[];
    description?: string;
    is_active?: boolean;
}

export interface ListWebhooksResponse {
    webhooks: Webhook[];
    total: number;
}

export interface ListDeliveriesResponse {
    deliveries: WebhookDelivery[];
    total: number;
}

export interface WebhookTestResult {
    success: boolean;
    statusCode: number;
    responseBody: string;
    responseTime: number;
}
