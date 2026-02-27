import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantContext.js';
import { query } from '../db/index.js';
import logger from '../utils/logger.js';

const router = Router({ mergeParams: true });

/**
 * GET /subscriptions/current
 * Get the current subscription for the tenant
 */
router.get(
    '/current',
    requireTenant,
    requireAuth,
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;

            const { rows } = await query(
                `SELECT id, tenant_id, plan, status, stripe_subscription_id,
                current_period_start, current_period_end,
                cancel_at_period_end, canceled_at, created_at, updated_at
         FROM subscriptions WHERE tenant_id = $1`,
                [tenantId]
            );

            if (rows.length === 0) {
                // Return default free plan
                return res.json({
                    subscription: {
                        plan: 'free',
                        status: 'active',
                        tenantId,
                    },
                });
            }

            res.json({ subscription: rows[0] });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /subscriptions/upgrade
 * Upgrade/downgrade subscription plan (placeholder for Stripe integration)
 */
router.post(
    '/upgrade',
    requireTenant,
    requireAuth,
    requireRole('owner'),
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;
            const { plan } = req.body;

            if (!['free', 'starter', 'pro'].includes(plan)) {
                return res.status(400).json({ error: 'Invalid plan. Choose: free, starter, or pro' });
            }

            // Upsert subscription
            await query(
                `INSERT INTO subscriptions (tenant_id, plan, status)
         VALUES ($1, $2, 'active')
         ON CONFLICT (tenant_id)
         DO UPDATE SET plan = $2, updated_at = NOW()`,
                [tenantId, plan]
            );

            logger.info({
                message: 'Subscription updated',
                tenantId,
                plan,
            });

            res.json({ success: true, plan });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
