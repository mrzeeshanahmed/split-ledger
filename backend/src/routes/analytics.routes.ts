import { Router, Request, Response } from 'express';
import { mrrService } from '../services/analytics/mrrService';
import { churnService } from '../services/analytics/churnService';
import { usageAnalyticsService } from '../services/analytics/usageAnalyticsService';
import { requireAuth } from '../middleware/auth';
// Assuming we have an admin middleware
// import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// Cache helper could be implemented with Redis, omitting for brevity in MVP

/**
 * GET /analytics/mrr
 * Returns current MRR and history
 */
router.get('/mrr', requireAuth, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const start = (startDate as string) || new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
        const end = (endDate as string) || new Date().toISOString().split('T')[0];

        const current = await mrrService.calculateCurrentMRR();
        const history = await mrrService.getMRRHistory(start, end);

        res.json({
            currentMrr: current.totalMrr,
            activeSubscriptions: current.activeSubscriptions,
            history
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch MRR data' });
    }
});

/**
 * GET /analytics/mrr/breakdown
 * Returns breakdown of new, expansion, contraction, churned MRR
 */
router.get('/mrr/breakdown', requireAuth, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const start = (startDate as string) || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
        const end = (endDate as string) || new Date().toISOString().split('T')[0];

        const breakdown = await mrrService.getMRRBreakdown(start, end);
        res.json(breakdown);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch MRR breakdown' });
    }
});

/**
 * GET /analytics/churn
 * Returns churn rate and list of churned tenants
 */
router.get('/churn', requireAuth, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        const start = (startDate as string) || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
        const end = (endDate as string) || new Date().toISOString().split('T')[0];

        const rate = await churnService.getChurnRate(start, end);
        const tenants = await churnService.getChurnedTenants(start, end);

        res.json({
            churnRate: rate,
            churnedTenants: tenants
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch churn data' });
    }
});

/**
 * GET /analytics/api-usage
 * Top endpoints, error rates, and latency
 */
router.get('/api-usage', requireAuth, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, granularity } = req.query;
        const start = (startDate as string) || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
        const end = (endDate as string) || new Date().toISOString();
        const gran = (granularity as 'hour' | 'day' | 'week') || 'day';

        const topEndpoints = await usageAnalyticsService.getTopEndpoints(10);
        const volume = await usageAnalyticsService.getRequestVolumeTimeSeries(start, end, gran);
        const p95 = await usageAnalyticsService.getP95LatencyByEndpoint();

        res.json({
            topEndpoints,
            requestVolume: volume,
            latencyAnalytics: p95
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch API usage data' });
    }
});

export const analyticsRoutes = router;
