import { Router } from 'express';
import { WebhookDispatcher } from '../services/webhookDispatcher.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { NotFoundError } from '../errors/index.js';
import logger from '../utils/logger.js';
import {
  createWebhookSchema,
  updateWebhookSchema,
  getWebhookSchema,
  deleteWebhookSchema,
  listWebhooksSchema,
  listDeadLettersSchema,
  redeliverDeadLetterSchema,
} from '../validation/webhook.validation.js';
import { getTenantSchema } from '../db/tenantClient.js';

const router = Router({ mergeParams: true });

function formatWebhook(webhook: any) {
  return {
    id: webhook.id,
    url: webhook.url,
    events: webhook.events,
    isActive: webhook.is_active,
    description: webhook.description,
    createdBy: webhook.created_by,
    createdAt: webhook.created_at,
    updatedAt: webhook.updated_at,
  };
}

function formatDelivery(delivery: any) {
  return {
    id: delivery.id,
    webhookId: delivery.webhook_id,
    eventType: delivery.event_type,
    payload: delivery.payload,
    status: delivery.status,
    attemptCount: delivery.attempt_count,
    nextRetryAt: delivery.next_retry_at,
    lastResponseStatus: delivery.last_response_status,
    lastResponseBody: delivery.last_response_body,
    lastError: delivery.last_error,
    deliveredAt: delivery.delivered_at,
    createdAt: delivery.created_at,
  };
}

/**
 * GET /webhooks/dead-letters
 * List all dead deliveries
 * Must be defined before /:webhookId to avoid route conflict
 */
router.get(
  '/dead-letters',
  validate(listDeadLettersSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const tenantSchema = getTenantSchema(req.tenantId!);
      const deliveries = await WebhookDispatcher.listDeadDeliveries(tenantSchema);
      res.json({ deliveries: deliveries.map(formatDelivery), total: deliveries.length });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /webhooks/dead-letters/:deliveryId/redeliver
 * Manually requeue a dead delivery
 */
router.post(
  '/dead-letters/:deliveryId/redeliver',
  validate(redeliverDeadLetterSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { deliveryId } = req.params;
      const tenantSchema = getTenantSchema(req.tenantId!);

      const delivery = await WebhookDispatcher.requeueDeadDelivery(tenantSchema, deliveryId);

      if (!delivery) {
        throw new NotFoundError('Dead delivery');
      }

      logger.info({
        message: 'Dead delivery requeued via API',
        deliveryId,
        tenantSchema,
        requestedBy: req.user!.id,
      });

      res.json({ delivery: formatDelivery(delivery) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /webhooks
 * List all webhooks
 */
router.get(
  '/',
  validate(listWebhooksSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const tenantSchema = getTenantSchema(req.tenantId!);
      const webhooks = await WebhookDispatcher.listWebhooks(tenantSchema);
      res.json({ webhooks: webhooks.map(formatWebhook), total: webhooks.length });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /webhooks
 * Create a new webhook
 */
router.post(
  '/',
  validate(createWebhookSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { url, events, description, secret } = req.body;
      const tenantSchema = getTenantSchema(req.tenantId!);
      const createdBy = req.user!.id;

      const webhook = await WebhookDispatcher.createWebhook(
        tenantSchema,
        url,
        events,
        createdBy,
        description,
        secret,
      );

      logger.info({
        message: 'Webhook created via API',
        webhookId: webhook.id,
        tenantSchema,
        createdBy,
      });

      res.status(201).json({ webhook: formatWebhook(webhook) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /webhooks/:webhookId
 * Get a single webhook by ID
 */
router.get(
  '/:webhookId',
  validate(getWebhookSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { webhookId } = req.params;
      const tenantSchema = getTenantSchema(req.tenantId!);

      const webhook = await WebhookDispatcher.getWebhookById(tenantSchema, webhookId);

      if (!webhook) {
        throw new NotFoundError('Webhook');
      }

      res.json({ webhook: formatWebhook(webhook) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * PATCH /webhooks/:webhookId
 * Update a webhook
 */
router.patch(
  '/:webhookId',
  validate(updateWebhookSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { webhookId } = req.params;
      const tenantSchema = getTenantSchema(req.tenantId!);
      const { url, events, description, is_active } = req.body;

      const webhook = await WebhookDispatcher.updateWebhook(tenantSchema, webhookId, {
        url,
        events,
        description,
        is_active,
      });

      if (!webhook) {
        throw new NotFoundError('Webhook');
      }

      logger.info({
        message: 'Webhook updated via API',
        webhookId,
        tenantSchema,
        updatedBy: req.user!.id,
      });

      res.json({ webhook: formatWebhook(webhook) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * DELETE /webhooks/:webhookId
 * Delete a webhook
 */
router.delete(
  '/:webhookId',
  validate(deleteWebhookSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { webhookId } = req.params;
      const tenantSchema = getTenantSchema(req.tenantId!);

      const deleted = await WebhookDispatcher.deleteWebhook(tenantSchema, webhookId);

      if (!deleted) {
        throw new NotFoundError('Webhook');
      }

      logger.info({
        message: 'Webhook deleted via API',
        webhookId,
        tenantSchema,
        deletedBy: req.user!.id,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export default router;
