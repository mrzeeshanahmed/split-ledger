import api from '@/lib/axios';
import {
    Webhook,
    WebhookDelivery,
    WebhookWithStats,
    CreateWebhookPayload,
    CreateWebhookResponse,
    UpdateWebhookPayload,
    ListWebhooksResponse,
    ListDeliveriesResponse,
    WebhookTestResult,
} from '../types/webhooks';

/**
 * Get available webhook event types
 */
export const getAvailableEvents = async (): Promise<string[]> => {
    const response = await api.get('/webhooks/events');
    return response.data.events;
};

/**
 * List all webhooks
 */
export const getWebhooks = async (
    isActive?: boolean,
    limit?: number,
    offset?: number
): Promise<ListWebhooksResponse> => {
    const response = await api.get('/webhooks', {
        params: { isActive, limit, offset },
    });
    return response.data;
};

/**
 * Get a single webhook with stats
 */
export const getWebhook = async (id: string): Promise<WebhookWithStats> => {
    const response = await api.get(`/webhooks/${id}`);
    return response.data;
};

/**
 * Create a new webhook
 */
export const createWebhook = async (
    payload: CreateWebhookPayload
): Promise<CreateWebhookResponse> => {
    const response = await api.post('/webhooks', payload);
    return response.data;
};

/**
 * Update an existing webhook
 */
export const updateWebhook = async (
    id: string,
    payload: UpdateWebhookPayload
): Promise<{ webhook: Webhook }> => {
    const response = await api.patch(`/webhooks/${id}`, payload);
    return response.data;
};

/**
 * Delete a webhook
 */
export const deleteWebhook = async (id: string): Promise<{ webhook: Webhook }> => {
    const response = await api.delete(`/webhooks/${id}`);
    return response.data;
};

/**
 * List deliveries for a webhook
 */
export const getWebhookDeliveries = async (
    webhookId: string,
    status?: string,
    limit?: number,
    offset?: number
): Promise<ListDeliveriesResponse> => {
    const response = await api.get(`/webhooks/${webhookId}/deliveries`, {
        params: { status, limit, offset },
    });
    return response.data;
};

/**
 * Get single delivery detail
 */
export const getWebhookDelivery = async (
    webhookId: string,
    deliveryId: string
): Promise<{ delivery: WebhookDelivery }> => {
    const response = await api.get(`/webhooks/${webhookId}/deliveries/${deliveryId}`);
    return response.data;
};

/**
 * Re-trigger a failed/dead delivery
 */
export const redeliverWebhook = async (
    webhookId: string,
    deliveryId: string
): Promise<{ delivery: WebhookDelivery }> => {
    const response = await api.post(`/webhooks/${webhookId}/deliveries/${deliveryId}/redeliver`);
    return response.data;
};

/**
 * Test a webhook endpoint synchronously
 */
export const testWebhook = async (
    webhookId: string,
    eventType: string,
    payload: unknown
): Promise<WebhookTestResult> => {
    const response = await api.post(`/webhooks/${webhookId}/test`, {
        eventType,
        payload,
    });
    return response.data;
};
