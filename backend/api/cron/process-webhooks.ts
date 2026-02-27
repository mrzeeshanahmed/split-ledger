import type { Request, Response } from 'express';
import { createApp } from '../../src/index.js';
import { getRedisClient } from '../../src/db/redis.js';
import { WebhookDispatcher } from '../../src/services/webhookDispatcher.js';
import logger from '../../src/utils/logger.js';

const REDIS_QUEUE_KEY = 'queue:webhooks';

const app = createApp();

/**
 * Vercel Cron: Process pending webhook deliveries
 * Runs every 5 minutes to process the webhook queue
 * Replaces the persistent webhook worker in serverless mode
 */
app.get('/api/cron/process-webhooks', async (req: Request, res: Response) => {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const redis = getRedisClient();
        let processed = 0;
        const maxBatch = 50; // Process max 50 per cron run to stay within 10s timeout

        for (let i = 0; i < maxBatch; i++) {
            const raw = await redis.lPop(REDIS_QUEUE_KEY);
            if (!raw) break;

            const job = JSON.parse(raw);

            // Import and process inline to keep within function scope
            const { tenantDb } = await import('../../src/db/tenantClient.js');
            const { deliveryId, webhookId, tenantSchema } = job;

            const deliveryResult = await tenantDb.query(
                tenantSchema,
                `SELECT * FROM webhook_deliveries WHERE id = $1`,
                [deliveryId]
            );

            if (deliveryResult.rows.length > 0 && deliveryResult.rows[0].status === 'pending') {
                // Simplified delivery processing for serverless
                const delivery = deliveryResult.rows[0];
                const webhook = await WebhookDispatcher.getWebhookWithSecretById(tenantSchema, webhookId);

                if (webhook) {
                    const envelope = delivery.payload;
                    const signature = WebhookDispatcher.signPayload(webhook.secret, envelope);

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
                            signal: AbortSignal.timeout(8000),
                        });

                        const success = response.status >= 200 && response.status < 300;

                        await tenantDb.query(
                            tenantSchema,
                            `UPDATE webhook_deliveries 
               SET status = $1, attempt_count = attempt_count + 1, 
                   last_response_status = $2, delivered_at = CASE WHEN $1 = 'success' THEN NOW() ELSE delivered_at END
               WHERE id = $3`,
                            [success ? 'success' : 'pending', response.status, deliveryId]
                        );
                    } catch {
                        // Requeue on failure
                        await redis.rPush(REDIS_QUEUE_KEY, raw);
                    }
                }
            }

            processed++;
        }

        logger.info({
            message: 'Cron: webhook processing complete',
            processed,
        });

        res.json({ success: true, processed });
    } catch (error) {
        logger.error({
            message: 'Cron: webhook processing failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Processing failed' });
    }
});

export default app;
