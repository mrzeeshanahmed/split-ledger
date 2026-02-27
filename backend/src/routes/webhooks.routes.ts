import { Router } from 'express';
import { WebhookDispatcher } from '../services/webhookDispatcher.js';
import { WEBHOOK_EVENTS } from '../config/webhookEvents.js';
import { requireAuth, requireRole, requireAuthOrApiKey } from '../middleware/index.js';
import { apiKeyRateLimiter } from '../middleware/apiKeyRateLimiter.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';
import { validate } from '../middleware/validate.js';
import { NotFoundError } from '../errors/index.js';
import logger from '../utils/logger.js';
import {
  createWebhookSchema,
  updateWebhookSchema,
  getWebhookSchema,
  deleteWebhookSchema,
  listWebhooksSchema,
  listDeliveriesSchema,
  getDeliverySchema,
  redeliverDeliverySchema,
  testWebhookSchema,
  listDeadLettersSchema,
  redeliverDeadLetterSchema,
} from '../validation/webhook.validation.js';
import { getTenantSchema } from '../db/tenantClient.js';

const router = Router({ mergeParams: true });

/**
 * Helper function to format webhook for API response
 * Never exposes secret
 */
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

/**
 * Helper function to format delivery for API response
 */
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
 * GET /webhooks/events
 * Get list of available webhook event types
 */
router.get('/events', requireAuth, requireRole('owner', 'admin'), (_req, res) => {
  res.json({ events: WEBHOOK_EVENTS });
});

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
  requireAuthOrApiKey,
  apiKeyRateLimiter,
  (req, res, next) => {
    if (req.user && !['owner', 'admin'].includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    if (req.apiKey && !req.apiKey.scopes.includes('read') && !req.apiKey.scopes.includes('write')) {
      return next(new ForbiddenError('Insufficient scope'));
    }
    next();
  },
  async (req, res, next) => {
    try {
      const tenantSchema = getTenantSchema(req.tenantId!);
      const isActive = req.query.isActive as boolean | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      const webhooks = await WebhookDispatcher.listWebhooks(tenantSchema, isActive, limit, offset);
      res.json({ webhooks: webhooks.map(formatWebhook), total: webhooks.length });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /webhooks
 * Create a new webhook
 * Returns the secret only once in the response
 */
router.post(
  '/',
  validate(createWebhookSchema),
  requireAuthOrApiKey,
  apiKeyRateLimiter,
  (req, res, next) => {
    if (req.user && !['owner', 'admin'].includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    if (req.apiKey && !req.apiKey.scopes.includes('write')) {
      return next(new ForbiddenError('Insufficient scope'));
    }
    next();
  },
  async (req, res, next) => {
    try {
      const { url, events, description, secret } = req.body;
      const tenantSchema = getTenantSchema(req.tenantId!);
      const createdBy = req.user?.id || req.apiKey?.createdBy;

      if (!createdBy) {
        throw new UnauthorizedError('User identity required to create webhook');
      }

      const result = await WebhookDispatcher.createWebhook(
        tenantSchema,
        url,
        events,
        createdBy,
        description,
        secret,
      );

      logger.info({
        message: 'Webhook created via API',
        webhookId: result.webhook.id,
        tenantSchema,
        createdBy,
      });

      // Return webhook with secret (shown only once)
      res.status(201).json({
        webhook: formatWebhook(result.webhook),
        secret: result.secret,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /webhooks/:webhookId
 * Get a single webhook by ID with delivery stats
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

      const result = await WebhookDispatcher.getWebhookWithStats(tenantSchema, webhookId);

      if (!result) {
        throw new NotFoundError('Webhook');
      }

      res.json({
        webhook: formatWebhook(result.webhook),
        stats: result.stats,
      });
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
 * Delete a webhook (soft delete)
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

      const webhook = await WebhookDispatcher.deleteWebhook(tenantSchema, webhookId);

      if (!webhook) {
        throw new NotFoundError('Webhook');
      }

      logger.info({
        message: 'Webhook deleted via API',
        webhookId,
        tenantSchema,
        deletedBy: req.user!.id,
      });

      res.json({ webhook: formatWebhook(webhook) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /webhooks/:webhookId/deliveries
 * List delivery logs for a specific webhook
 */
router.get(
  '/:webhookId/deliveries',
  validate(listDeliveriesSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { webhookId } = req.params;
      const tenantSchema = getTenantSchema(req.tenantId!);
      const status = req.query.status as 'pending' | 'success' | 'failed' | 'dead' | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

      // Verify webhook exists
      const webhook = await WebhookDispatcher.getWebhookById(tenantSchema, webhookId);
      if (!webhook) {
        throw new NotFoundError('Webhook');
      }

      const deliveries = await WebhookDispatcher.listWebhookDeliveries(
        tenantSchema,
        webhookId,
        status,
        limit,
        offset,
      );

      res.json({ deliveries: deliveries.map(formatDelivery), total: deliveries.length });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /webhooks/:webhookId/deliveries/:deliveryId
 * Get full delivery detail
 */
router.get(
  '/:webhookId/deliveries/:deliveryId',
  validate(getDeliverySchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { webhookId, deliveryId } = req.params;
      const tenantSchema = getTenantSchema(req.tenantId!);

      const delivery = await WebhookDispatcher.getWebhookDelivery(
        tenantSchema,
        webhookId,
        deliveryId,
      );

      if (!delivery) {
        throw new NotFoundError('Webhook delivery');
      }

      res.json({ delivery: formatDelivery(delivery) });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /webhooks/:webhookId/deliveries/:deliveryId/redeliver
 * Re-trigger a specific delivery
 */
router.post(
  '/:webhookId/deliveries/:deliveryId/redeliver',
  validate(redeliverDeliverySchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { webhookId, deliveryId } = req.params;
      const tenantSchema = getTenantSchema(req.tenantId!);

      const delivery = await WebhookDispatcher.redeliverWebhook(
        tenantSchema,
        webhookId,
        deliveryId,
      );

      if (!delivery) {
        throw new NotFoundError('Webhook delivery');
      }

      logger.info({
        message: 'Webhook delivery redelivered via API',
        deliveryId,
        webhookId,
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
 * POST /webhooks/:webhookId/test
 * Test webhook with a live HTTP request (not logged to deliveries)
 */
router.post(
  '/:webhookId/test',
  validate(testWebhookSchema),
  requireAuth,
  requireRole('owner', 'admin'),
  async (req, res, next) => {
    try {
      const { webhookId } = req.params;
      const { eventType, payload } = req.body;
      const tenantSchema = getTenantSchema(req.tenantId!);

      const result = await WebhookDispatcher.testWebhook(
        tenantSchema,
        webhookId,
        eventType,
        payload,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
