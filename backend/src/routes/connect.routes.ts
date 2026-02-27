import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantContext.js';
import { getPaymentProvider } from '../services/payment/paymentProvider.js';
import { query } from '../db/index.js';
import logger from '../utils/logger.js';

const router = Router({ mergeParams: true });

/**
 * POST /connect/create-account
 * Create a Stripe Connect account for the tenant
 */
router.post(
    '/create-account',
    requireTenant,
    requireAuth,
    requireRole('owner'),
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;
            const email = req.body.email || req.user?.email;

            // Check if tenant already has a Connect account
            const { rows } = await query(
                'SELECT stripe_account_id FROM tenants WHERE id = $1',
                [tenantId]
            );

            if (rows[0]?.stripe_account_id) {
                return res.json({
                    success: true,
                    accountId: rows[0].stripe_account_id,
                    message: 'Connect account already exists',
                });
            }

            const provider = getPaymentProvider();
            const result = await provider.createConnectAccount(tenantId, email);

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            // Store the account ID
            await query(
                'UPDATE tenants SET stripe_account_id = $1 WHERE id = $2',
                [result.accountId, tenantId]
            );

            logger.info({
                message: 'Stripe Connect account created for tenant',
                tenantId,
                accountId: result.accountId,
            });

            res.json({ success: true, accountId: result.accountId });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /connect/create-link
 * Generate an onboarding link for Stripe Connect
 */
router.post(
    '/create-link',
    requireTenant,
    requireAuth,
    requireRole('owner'),
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;

            const { rows } = await query(
                'SELECT stripe_account_id FROM tenants WHERE id = $1',
                [tenantId]
            );

            const stripeAccountId = rows[0]?.stripe_account_id;
            if (!stripeAccountId) {
                return res.status(400).json({ error: 'No Stripe Connect account found. Create one first.' });
            }

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const returnUrl = `${frontendUrl}/dashboard/stripe-connect?status=complete`;
            const refreshUrl = `${frontendUrl}/dashboard/stripe-connect?status=refresh`;

            const provider = getPaymentProvider();
            const result = await provider.createAccountLink(stripeAccountId, returnUrl, refreshUrl);

            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            res.json({ success: true, url: result.url });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /connect/status
 * Get the status of the tenant's Stripe Connect account
 */
router.get(
    '/status',
    requireTenant,
    requireAuth,
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;

            const { rows } = await query(
                `SELECT stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled,
                stripe_details_submitted, stripe_onboarding_complete
         FROM tenants WHERE id = $1`,
                [tenantId]
            );

            const tenant = rows[0];
            if (!tenant?.stripe_account_id) {
                return res.json({
                    connected: false,
                    message: 'No Stripe Connect account linked',
                });
            }

            // Fetch live status from Stripe
            const provider = getPaymentProvider();
            const status = await provider.getConnectAccountStatus(tenant.stripe_account_id);

            // Update local cache
            await query(
                `UPDATE tenants SET
           stripe_charges_enabled = $1,
           stripe_payouts_enabled = $2,
           stripe_details_submitted = $3,
           stripe_onboarding_complete = $4
         WHERE id = $5`,
                [
                    status.chargesEnabled,
                    status.payoutsEnabled,
                    status.detailsSubmitted,
                    status.chargesEnabled && status.payoutsEnabled,
                    tenantId,
                ]
            );

            res.json({
                connected: true,
                accountId: status.accountId,
                chargesEnabled: status.chargesEnabled,
                payoutsEnabled: status.payoutsEnabled,
                detailsSubmitted: status.detailsSubmitted,
                onboardingComplete: status.chargesEnabled && status.payoutsEnabled,
                requirements: status.requirements,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /connect/dashboard-link
 * Generate a Stripe dashboard login link for the connected account
 */
router.post(
    '/dashboard-link',
    requireTenant,
    requireAuth,
    requireRole('owner'),
    async (req, res, next) => {
        try {
            const tenantId = req.tenantId!;

            const { rows } = await query(
                'SELECT stripe_account_id FROM tenants WHERE id = $1',
                [tenantId]
            );

            const stripeAccountId = rows[0]?.stripe_account_id;
            if (!stripeAccountId) {
                return res.status(400).json({ error: 'No Stripe Connect account found' });
            }

            const provider = getPaymentProvider();
            const result = await provider.createConnectLoginLink(stripeAccountId);

            res.json({ success: true, url: result.url });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
