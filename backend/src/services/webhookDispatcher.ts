import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { tenantDb } from '../db/tenantClient.js';
import { getRedisClient } from '../db/redis.js';
import logger from '../utils/logger.js';
import {
  Webhook,
  WebhookWithSecret,
  WebhookDelivery,
  WebhookEventEnvelope,
  WebhookDeliveryJob,
  CreateWebhookResult,
  UpdateWebhookInput,
  WebhookStats,
  WebhookTestResult,
} from '../types/webhook.js';

const REDIS_QUEUE_KEY = 'queue:webhooks';
const MAX_RESPONSE_BODY_LENGTH = 1000;

export class WebhookDispatcher {
  /**
   * Sign webhook payload with HMAC-SHA256 using webhook secret
   */
  static signPayload(secret: string, payload: WebhookEventEnvelope): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Dispatch a webhook event to all active webhooks subscribed to that event
   */
  static async dispatchWebhookEvent(
    tenantSchema: string,
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const activeWebhooks = await tenantDb.query<WebhookWithSecret>(
      tenantSchema,
      `SELECT * FROM webhooks WHERE is_active = true AND $1 = ANY(events)`,
      [eventType],
    );

    if (activeWebhooks.rows.length === 0) {
      logger.debug({
        message: 'No active webhooks for event type',
        eventType,
        tenantSchema,
      });
      return;
    }

    const envelope: WebhookEventEnvelope = {
      id: `evt_${uuidv4().replace(/-/g, '')}`,
      type: eventType,
      created_at: new Date().toISOString(),
      data,
    };

    const redis = getRedisClient();

    for (const webhook of activeWebhooks.rows) {
      const deliveryResult = await tenantDb.query<WebhookDelivery>(
        tenantSchema,
        `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, status)
         VALUES ($1, $2, $3, 'pending')
         RETURNING *`,
        [webhook.id, eventType, JSON.stringify(envelope)],
      );

      const delivery = deliveryResult.rows[0];

      const job: WebhookDeliveryJob = {
        deliveryId: delivery.id,
        webhookId: webhook.id,
        tenantSchema,
      };

      await redis.rPush(REDIS_QUEUE_KEY, JSON.stringify(job));

      logger.info({
        message: 'Webhook delivery enqueued',
        deliveryId: delivery.id,
        webhookId: webhook.id,
        eventType,
        tenantSchema,
      });
    }
  }

  /**
   * Create a webhook (returns secret only once)
   */
  static async createWebhook(
    tenantSchema: string,
    url: string,
    events: string[],
    createdBy: string,
    description?: string,
    secret?: string,
  ): Promise<CreateWebhookResult> {
    const webhookSecret =
      secret || crypto.randomBytes(32).toString('hex');

    const result = await tenantDb.query<WebhookWithSecret>(
      tenantSchema,
      `INSERT INTO webhooks (url, secret, events, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, url, events, is_active, description, created_by, created_at, updated_at`,
      [url, webhookSecret, events, description || null, createdBy],
    );

    const webhook = result.rows[0];

    logger.info({
      message: 'Webhook created',
      webhookId: webhook.id,
      tenantSchema,
      createdBy,
    });

    return {
      webhook,
      secret: webhookSecret,
    };
  }

  /**
   * Get webhook by ID (never returns secret)
   */
  static async getWebhookById(
    tenantSchema: string,
    webhookId: string,
  ): Promise<Webhook | null> {
    const result = await tenantDb.query<Webhook>(
      tenantSchema,
      `SELECT id, url, events, is_active, description, created_by, created_at, updated_at
       FROM webhooks WHERE id = $1`,
      [webhookId],
    );
    return result.rows[0] || null;
  }

  /**
   * Get webhook by ID with secret (for internal use only)
   */
  static async getWebhookWithSecretById(
    tenantSchema: string,
    webhookId: string,
  ): Promise<WebhookWithSecret | null> {
    const result = await tenantDb.query<WebhookWithSecret>(
      tenantSchema,
      `SELECT * FROM webhooks WHERE id = $1`,
      [webhookId],
    );
    return result.rows[0] || null;
  }

  /**
   * Get webhook by ID with delivery stats (never returns secret)
   */
  static async getWebhookWithStats(
    tenantSchema: string,
    webhookId: string,
  ): Promise<{ webhook: Webhook; stats: WebhookStats } | null> {
    const webhook = await this.getWebhookById(tenantSchema, webhookId);
    if (!webhook) {
      return null;
    }

    const stats = await this.getWebhookStats(tenantSchema, webhookId);
    return { webhook, stats };
  }

  /**
   * Get delivery statistics for a webhook
   */
  static async getWebhookStats(
    tenantSchema: string,
    webhookId: string,
  ): Promise<WebhookStats> {
    const totalResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM webhook_deliveries WHERE webhook_id = $1`,
      [webhookId],
    );

    const successResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM webhook_deliveries
       WHERE webhook_id = $1 AND status = 'success'`,
      [webhookId],
    );

    const failedResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM webhook_deliveries
       WHERE webhook_id = $1 AND status = 'failed'`,
      [webhookId],
    );

    const deadResult = await tenantDb.query<{ count: string }>(
      tenantSchema,
      `SELECT COUNT(*) as count FROM webhook_deliveries
       WHERE webhook_id = $1 AND status = 'dead'`,
      [webhookId],
    );

    const lastDeliveryResult = await tenantDb.query<{ last_delivery_at: Date }>(
      tenantSchema,
      `SELECT MAX(delivered_at) as last_delivery_at FROM webhook_deliveries
       WHERE webhook_id = $1 AND delivered_at IS NOT NULL`,
      [webhookId],
    );

    const totalDeliveries = parseInt(totalResult.rows[0].count, 10);
    const successCount = parseInt(successResult.rows[0].count, 10);
    const failureCount = parseInt(failedResult.rows[0].count, 10);
    const deadCount = parseInt(deadResult.rows[0].count, 10);
    const lastDeliveryAt = lastDeliveryResult.rows[0].last_delivery_at || null;

    return {
      totalDeliveries,
      successCount,
      failureCount,
      deadCount,
      lastDeliveryAt,
      successRate: totalDeliveries > 0 ? (successCount / totalDeliveries) * 100 : 0,
    };
  }

  /**
   * Update a webhook
   */
  static async updateWebhook(
    tenantSchema: string,
    webhookId: string,
    updates: UpdateWebhookInput,
  ): Promise<Webhook | null> {
    const updateFields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.url !== undefined) {
      updateFields.push(`url = $${paramIndex++}`);
      values.push(updates.url);
    }
    if (updates.events !== undefined) {
      updateFields.push(`events = $${paramIndex++}`);
      values.push(updates.events);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }

    if (updateFields.length === 0) {
      return this.getWebhookById(tenantSchema, webhookId);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(webhookId);

    const result = await tenantDb.query<Webhook>(
      tenantSchema,
      `UPDATE webhooks SET ${updateFields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, url, events, is_active, description, created_by, created_at, updated_at`,
      values,
    );

    return result.rows[0] || null;
  }

  /**
   * Soft delete a webhook (set is_active = false)
   */
  static async deleteWebhook(
    tenantSchema: string,
    webhookId: string,
  ): Promise<Webhook | null> {
    const result = await tenantDb.query<Webhook>(
      tenantSchema,
      `UPDATE webhooks
       SET is_active = false, updated_at = NOW()
       WHERE id = $1
       RETURNING id, url, events, is_active, description, created_by, created_at, updated_at`,
      [webhookId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    logger.info({
      message: 'Webhook soft deleted',
      webhookId,
      tenantSchema,
    });

    return result.rows[0];
  }

  /**
   * List all webhooks for a tenant (never returns secret)
   */
  static async listWebhooks(
    tenantSchema: string,
    isActive?: boolean,
    limit?: number,
    offset = 0,
  ): Promise<Webhook[]> {
    let query = `SELECT id, url, events, is_active, description, created_by, created_at, updated_at
                  FROM webhooks`;
    const params: unknown[] = [];

    const conditions: string[] = [];
    if (isActive !== undefined) {
      conditions.push(`is_active = $${params.length + 1}`);
      params.push(isActive);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC`;

    if (limit !== undefined) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    if (offset > 0) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }

    const result = await tenantDb.query<Webhook>(tenantSchema, query, params);
    return result.rows;
  }

  /**
   * List webhook deliveries with pagination and filters
   */
  static async listWebhookDeliveries(
    tenantSchema: string,
    webhookId: string,
    status?: 'pending' | 'success' | 'failed' | 'dead',
    limit = 100,
    offset = 0,
  ): Promise<WebhookDelivery[]> {
    let query = `SELECT * FROM webhook_deliveries WHERE webhook_id = $1`;
    const params: unknown[] = [webhookId];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await tenantDb.query<WebhookDelivery>(tenantSchema, query, params);
    return result.rows;
  }

  /**
   * Get a single webhook delivery by ID
   */
  static async getWebhookDelivery(
    tenantSchema: string,
    webhookId: string,
    deliveryId: string,
  ): Promise<WebhookDelivery | null> {
    const result = await tenantDb.query<WebhookDelivery>(
      tenantSchema,
      `SELECT * FROM webhook_deliveries WHERE id = $1 AND webhook_id = $2`,
      [deliveryId, webhookId],
    );
    return result.rows[0] || null;
  }

  /**
   * Redeliver a webhook delivery
   */
  static async redeliverWebhook(
    tenantSchema: string,
    webhookId: string,
    deliveryId: string,
  ): Promise<WebhookDelivery | null> {
    const result = await tenantDb.query<WebhookDelivery>(
      tenantSchema,
      `UPDATE webhook_deliveries
       SET status = 'pending', attempt_count = 0, next_retry_at = NULL, last_error = NULL
       WHERE id = $1 AND webhook_id = $2
       RETURNING *`,
      [deliveryId, webhookId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const delivery = result.rows[0];
    const redis = getRedisClient();

    const job: WebhookDeliveryJob = {
      deliveryId: delivery.id,
      webhookId: webhookId,
      tenantSchema,
    };

    await redis.rPush(REDIS_QUEUE_KEY, JSON.stringify(job));

    logger.info({
      message: 'Webhook delivery requeued',
      deliveryId,
      webhookId,
      tenantSchema,
    });

    return delivery;
  }

  /**
   * Test a webhook by sending a live HTTP request (not logged to deliveries)
   */
  static async testWebhook(
    tenantSchema: string,
    webhookId: string,
    eventType: string,
    payloadData?: Record<string, unknown>,
  ): Promise<WebhookTestResult> {
    const webhookResult = await tenantDb.query<WebhookWithSecret>(
      tenantSchema,
      `SELECT * FROM webhooks WHERE id = $1`,
      [webhookId],
    );

    if (webhookResult.rows.length === 0) {
      throw new Error('Webhook not found');
    }

    const webhook = webhookResult.rows[0];

    const envelope: WebhookEventEnvelope = {
      id: `evt_test_${uuidv4().replace(/-/g, '')}`,
      type: eventType,
      created_at: new Date().toISOString(),
      data: payloadData || { test: true },
    };

    const signature = this.signPayload(webhook.secret, envelope);

    const startTime = Date.now();
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;
    let success = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': `sha256=${signature}`,
            'X-Webhook-ID': webhook.id,
            'X-Delivery-ID': 'test',
          },
          body: JSON.stringify(envelope),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseStatus = response.status;
        const rawBody = await response.text();
        responseBody = rawBody.substring(0, MAX_RESPONSE_BODY_LENGTH);
        success = response.status >= 200 && response.status < 300;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      errorMessage =
        err instanceof Error ? err.message : 'Unknown error during HTTP request';
    }

    const latencyMs = Date.now() - startTime;

    logger.info({
      message: 'Webhook test completed',
      webhookId,
      tenantSchema,
      success,
      responseStatus,
      latencyMs,
      error: errorMessage,
    });

    return {
      success,
      statusCode: responseStatus,
      responseBody,
      error: errorMessage,
      latencyMs,
    };
  }

  /**
   * List all dead deliveries
   */
  static async listDeadDeliveries(tenantSchema: string): Promise<WebhookDelivery[]> {
    const result = await tenantDb.query<WebhookDelivery>(
      tenantSchema,
      `SELECT * FROM webhook_deliveries WHERE status = 'dead' ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  /**
   * Requeue a dead delivery
   */
  static async requeueDeadDelivery(
    tenantSchema: string,
    deliveryId: string,
  ): Promise<WebhookDelivery | null> {
    const result = await tenantDb.query<WebhookDelivery>(
      tenantSchema,
      `UPDATE webhook_deliveries
       SET status = 'pending', attempt_count = 0, next_retry_at = NULL, last_error = NULL
       WHERE id = $1 AND status = 'dead'
       RETURNING *`,
      [deliveryId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const delivery = result.rows[0];
    const redis = getRedisClient();

    const job: WebhookDeliveryJob = {
      deliveryId: delivery.id,
      webhookId: delivery.webhook_id,
      tenantSchema,
    };

    await redis.rPush(REDIS_QUEUE_KEY, JSON.stringify(job));

    logger.info({
      message: 'Dead delivery requeued',
      deliveryId,
      tenantSchema,
    });

    return delivery;
  }
}
