import { getRedisClient } from '../db/redis.js';
import { tenantDb } from '../db/tenantClient.js';
import { WebhookDispatcher } from '../services/webhookDispatcher.js';
import logger from '../utils/logger.js';
import { WebhookWithSecret, WebhookDelivery, WebhookDeliveryJob } from '../types/webhook.js';

const REDIS_QUEUE_KEY = 'queue:webhooks';
const POLL_INTERVAL_MS = 1000;
const HTTP_TIMEOUT_MS = 10000;
const MAX_RESPONSE_BODY_LENGTH = 1000;

const RETRY_DELAYS_MS = [
  1 * 60 * 1000,
  5 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
  12 * 60 * 60 * 1000,
];

let running = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;

async function processDelivery(job: WebhookDeliveryJob): Promise<void> {
  const { deliveryId, webhookId, tenantSchema } = job;

  const deliveryResult = await tenantDb.query<WebhookDelivery>(
    tenantSchema,
    `SELECT * FROM webhook_deliveries WHERE id = $1`,
    [deliveryId],
  );

  if (deliveryResult.rows.length === 0) {
    logger.warn({
      message: 'Webhook delivery not found, skipping',
      deliveryId,
      tenantSchema,
    });
    return;
  }

  const delivery = deliveryResult.rows[0];

  if (delivery.status !== 'pending') {
    logger.debug({
      message: 'Webhook delivery no longer pending, skipping',
      deliveryId,
      status: delivery.status,
    });
    return;
  }

  const webhook: WebhookWithSecret | null = await WebhookDispatcher.getWebhookWithSecretById(tenantSchema, webhookId);

  if (!webhook) {
    logger.warn({
      message: 'Webhook not found for delivery, marking failed',
      deliveryId,
      webhookId,
    });
    await tenantDb.query(
      tenantSchema,
      `UPDATE webhook_deliveries SET status = 'dead', last_error = $1 WHERE id = $2`,
      ['Webhook configuration not found', deliveryId],
    );
    return;
  }

  const envelope = delivery.payload;
  const signature = WebhookDispatcher.signPayload(webhook.secret, envelope);

  const startTime = Date.now();
  let responseStatus: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;
  let success = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-ID': webhook.id,
          'X-Delivery-ID': deliveryId,
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
  const newAttemptCount = delivery.attempt_count + 1;

  logger.info({
    message: 'Webhook delivery attempt',
    deliveryId,
    webhookId,
    tenantSchema,
    success,
    responseStatus,
    latencyMs,
    attemptCount: newAttemptCount,
    error: errorMessage,
  });

  if (success) {
    await tenantDb.query(
      tenantSchema,
      `UPDATE webhook_deliveries
       SET status = 'success',
           attempt_count = $1,
           last_response_status = $2,
           last_response_body = $3,
           delivered_at = NOW()
       WHERE id = $4`,
      [newAttemptCount, responseStatus, responseBody, deliveryId],
    );
    return;
  }

  const retryDelayMs = RETRY_DELAYS_MS[newAttemptCount - 1];

  if (retryDelayMs === undefined) {
    await tenantDb.query(
      tenantSchema,
      `UPDATE webhook_deliveries
       SET status = 'dead',
           attempt_count = $1,
           last_response_status = $2,
           last_response_body = $3,
           last_error = $4
       WHERE id = $5`,
      [
        newAttemptCount,
        responseStatus,
        responseBody,
        errorMessage || `HTTP ${responseStatus}`,
        deliveryId,
      ],
    );

    logger.warn({
      message: 'Webhook delivery permanently failed (dead)',
      deliveryId,
      webhookId,
      tenantSchema,
      attemptCount: newAttemptCount,
    });

    notifyTenantOwnerOnDeadDelivery(tenantSchema, webhook, deliveryId).catch(
      (err) => {
        logger.error({
          message: 'Failed to send dead delivery notification',
          error: err instanceof Error ? err.message : 'Unknown error',
          deliveryId,
        });
      },
    );
    return;
  }

  const nextRetryAt = new Date(Date.now() + retryDelayMs);

  await tenantDb.query(
    tenantSchema,
    `UPDATE webhook_deliveries
     SET status = 'pending',
         attempt_count = $1,
         next_retry_at = $2,
         last_response_status = $3,
         last_response_body = $4,
         last_error = $5
     WHERE id = $6`,
    [
      newAttemptCount,
      nextRetryAt.toISOString(),
      responseStatus,
      responseBody,
      errorMessage || `HTTP ${responseStatus}`,
      deliveryId,
    ],
  );

  const redis = getRedisClient();
  const delaySeconds = Math.round(retryDelayMs / 1000);
  const retryJobKey = `retry:webhook:${deliveryId}`;

  await redis.set(retryJobKey, JSON.stringify(job), { EX: delaySeconds + 60 });

  scheduleRetry(job, retryDelayMs);
}

function scheduleRetry(job: WebhookDeliveryJob, delayMs: number): void {
  setTimeout(async () => {
    if (!running) return;
    try {
      const redis = getRedisClient();
      await redis.rPush(REDIS_QUEUE_KEY, JSON.stringify(job));
      logger.debug({
        message: 'Webhook delivery requeued after backoff',
        deliveryId: job.deliveryId,
        delayMs,
      });
    } catch (err) {
      logger.error({
        message: 'Failed to requeue webhook delivery',
        deliveryId: job.deliveryId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, delayMs);
}

async function notifyTenantOwnerOnDeadDelivery(
  tenantSchema: string,
  webhook: WebhookWithSecret,
  deliveryId: string,
): Promise<void> {
  logger.info({
    message: 'TODO: notify tenant owner of dead webhook delivery',
    tenantSchema,
    webhookId: webhook.id,
    deliveryId,
  });
}

async function pollQueue(): Promise<void> {
  if (!running) return;

  try {
    const redis = getRedisClient();
    const raw = await redis.lPop(REDIS_QUEUE_KEY);

    if (raw) {
      const job = JSON.parse(raw) as WebhookDeliveryJob;
      processDelivery(job).catch((err) => {
        logger.error({
          message: 'Unhandled error processing webhook delivery',
          deliveryId: job.deliveryId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      });
    }
  } catch (err) {
    logger.error({
      message: 'Error polling webhook queue',
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }

  if (running) {
    pollTimer = setTimeout(pollQueue, POLL_INTERVAL_MS);
  }
}

export function startWebhookWorker(): void {
  if (running) {
    logger.warn({ message: 'Webhook worker already running' });
    return;
  }

  running = true;
  pollTimer = setTimeout(pollQueue, POLL_INTERVAL_MS);

  logger.info({ message: 'Webhook worker started' });
}

export function stopWebhookWorker(): void {
  running = false;
  if (pollTimer !== null) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  logger.info({ message: 'Webhook worker stopped' });
}
