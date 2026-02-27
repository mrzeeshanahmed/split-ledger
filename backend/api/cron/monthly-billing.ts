import type { Request, Response } from 'express';
import { createApp } from '../../src/index.js';
import { query } from '../../src/db/index.js';
import logger from '../../src/utils/logger.js';

const app = createApp();

/**
 * Vercel Cron: Monthly billing generation
 * Runs on the 1st of each month at midnight UTC
 * Generates billing records for all active tenants
 */
app.get('/api/cron/monthly-billing', async (req: Request, res: Response) => {
    // Verify cron secret
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Get all active tenants
        const { rows: tenants } = await query(
            'SELECT id, name, subdomain FROM tenants WHERE status = $1',
            ['active']
        );

        let processed = 0;
        let errors = 0;

        for (const tenant of tenants) {
            try {
                const schemaName = `tenant_${tenant.id.replace(/-/g, '')}`;

                const { UsageMeterService } = await import('../../src/services/billing/usageMeter.js');
                const { BillingCalculatorService } = await import('../../src/services/billing/billingCalculator.js');

                // Calculate billing period (last full month)
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

                const usageAggregations = await UsageMeterService.getUsageForPeriod(
                    schemaName,
                    { startDate, endDate }
                );

                const billing = BillingCalculatorService.previewBilling(
                    'free', // TODO: fetch subscription plan from DB in Phase 8
                    usageAggregations as any
                );

                logger.info({
                    message: 'Cron: billing generated for tenant',
                    tenantId: tenant.id,
                    tenantName: tenant.name,
                    billingPeriod: `${startDate.toISOString().slice(0, 7)}`,
                    totalFormatted: billing.totalFormatted,
                });

                processed++;
            } catch (error) {
                errors++;
                logger.error({
                    message: 'Cron: billing generation failed for tenant',
                    tenantId: tenant.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        logger.info({
            message: 'Cron: monthly billing complete',
            total: tenants.length,
            processed,
            errors,
        });

        res.json({ success: true, total: tenants.length, processed, errors });
    } catch (error) {
        logger.error({
            message: 'Cron: monthly billing failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        res.status(500).json({ error: 'Billing generation failed' });
    }
});

export default app;
