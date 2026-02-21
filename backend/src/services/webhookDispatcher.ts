import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { tenantDb } from '../db/tenantClient.js';
import { getRedisClient } from '../db/redis.js';
import logger from '../utils/logger.js';
import {
  Webhook,
  WebhookDelivery,
  WebhookEventEnvelope,
  WebhookDeliveryJob,
} from '../types/webhook.js';

const REDIS_QUEUE_KEY = 'queue:webhooks';

export class WebhookDispatcher {
  static signPayload(secret: string, payload: WebhookEventEnvelope): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  static async dispatchWebhookEvent(
    tenantSchema: string,
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const activeWebhooks = await tenantDb.query<Webhook>(
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

  static async getWebhookById(
    tenantSchema: string,
    webhookId: string,
  ): Promise<Webhook | null> {
    const result = await tenantDb.query<Webhook>(
      tenantSchema,
      `SELECT * FROM webhooks WHERE id = $1`,
      [webhookId],
    );
    return result.rows[0] || null;
  }

  static async createWebhook(
    tenantSchema: string,
    url: string,
    events: string[],
    createdBy: string,
    description?: string,
    secret?: string,
  ): Promise<Webhook> {
    const webhookSecret =
      secret || crypto.randomBytes(32).toString('hex');

    const result = await tenantDb.query<Webhook>(
      tenantSchema,
      `INSERT INTO webhooks (url, secret, events, description, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [url, webhookSecret, events, description || null, createdBy],
    );

    logger.info({
      message: 'Webhook created',
      webhookId: result.rows[0].id,
      tenantSchema,
      createdBy,
    });

    return result.rows[0];
  }

  static async updateWebhook(
    tenantSchema: string,
    webhookId: string,
    updates: {
      url?: string;
      events?: string[];
      description?: string;
      is_active?: boolean;
    },
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
      `UPDATE webhooks SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return result.rows[0] || null;
  }

  static async deleteWebhook(
    tenantSchema: string,
    webhookId: string,
  ): Promise<boolean> {
    const result = await tenantDb.query(
      tenantSchema,
      `DELETE FROM webhooks WHERE id = $1`,
      [webhookId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async listWebhooks(tenantSchema: string): Promise<Webhook[]> {
    const result = await tenantDb.query<Webhook>(
      tenantSchema,
      `SELECT * FROM webhooks ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  static async listDeadDeliveries(tenantSchema: string): Promise<WebhookDelivery[]> {
    const result = await tenantDb.query<WebhookDelivery>(
      tenantSchema,
      `SELECT * FROM webhook_deliveries WHERE status = 'dead' ORDER BY created_at DESC`,
    );
    return result.rows;
  }

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
