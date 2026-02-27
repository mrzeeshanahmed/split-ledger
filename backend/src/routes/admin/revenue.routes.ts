import { Router } from 'express';
import { query } from '../../db/index.js';
import logger from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/admin/revenue/summary
 * Get platform-wide revenue summary
 */
router.get('/summary', async (req, res, next) => {
    try {
        // Get total tenants
        const { rows: tenantCount } = await query(
            'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status = $1) as active FROM tenants',
            ['active']
        );

        // Get revenue from revenue_records across all tenant schemas
        // This queries the public tenants table and attempts to sum revenue
        const { rows: tenants } = await query(
            'SELECT id FROM tenants WHERE status = $1',
            ['active']
        );

        let totalRevenue = 0;
        let totalPlatformFee = 0;
        let totalTenantPayout = 0;

        for (const tenant of tenants) {
            const schemaName = `tenant_${tenant.id.replace(/-/g, '')}`;
            try {
                const { rows: revenueRows } = await query(
                    `SELECT
             COALESCE(SUM(total_amount), 0) as total,
             COALESCE(SUM(platform_fee), 0) as platform_fee,
             COALESCE(SUM(tenant_payout), 0) as tenant_payout
           FROM ${schemaName}.revenue_records`
                );
                if (revenueRows[0]) {
                    totalRevenue += parseFloat(revenueRows[0].total) || 0;
                    totalPlatformFee += parseFloat(revenueRows[0].platform_fee) || 0;
                    totalTenantPayout += parseFloat(revenueRows[0].tenant_payout) || 0;
                }
            } catch {
                // Schema may not have revenue_records table
            }
        }

        res.json({
            summary: {
                totalTenants: parseInt(tenantCount[0].total, 10),
                activeTenants: parseInt(tenantCount[0].active, 10),
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                platformFeeCollected: Math.round(totalPlatformFee * 100) / 100,
                tenantPayouts: Math.round(totalTenantPayout * 100) / 100,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/revenue/by-tenant
 * Get revenue breakdown per tenant
 */
router.get('/by-tenant', async (req, res, next) => {
    try {
        const { rows: tenants } = await query(
            `SELECT id, name, subdomain, status, created_at FROM tenants ORDER BY created_at DESC`
        );

        const breakdown = [];

        for (const tenant of tenants) {
            const schemaName = `tenant_${tenant.id.replace(/-/g, '')}`;
            let revenue = { total: 0, platform_fee: 0, tenant_payout: 0 };

            try {
                const { rows } = await query(
                    `SELECT
             COALESCE(SUM(total_amount), 0) as total,
             COALESCE(SUM(platform_fee), 0) as platform_fee,
             COALESCE(SUM(tenant_payout), 0) as tenant_payout
           FROM ${schemaName}.revenue_records`
                );
                if (rows[0]) {
                    revenue = {
                        total: parseFloat(rows[0].total) || 0,
                        platform_fee: parseFloat(rows[0].platform_fee) || 0,
                        tenant_payout: parseFloat(rows[0].tenant_payout) || 0,
                    };
                }
            } catch {
                // Schema may not exist
            }

            breakdown.push({
                tenantId: tenant.id,
                name: tenant.name,
                subdomain: tenant.subdomain,
                status: tenant.status,
                createdAt: tenant.created_at,
                revenue,
            });
        }

        res.json({ breakdown });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/admin/revenue/trends
 * Get monthly revenue trends (last 12 months)
 */
router.get('/trends', async (req, res, next) => {
    try {
        const { rows: tenants } = await query(
            'SELECT id FROM tenants WHERE status = $1',
            ['active']
        );

        // Aggregate monthly data across all tenants
        const monthlyData: Record<string, { revenue: number; platformFee: number; tenantPayout: number }> = {};

        for (const tenant of tenants) {
            const schemaName = `tenant_${tenant.id.replace(/-/g, '')}`;
            try {
                const { rows } = await query(
                    `SELECT
             TO_CHAR(billing_period_start, 'YYYY-MM') as month,
             COALESCE(SUM(total_amount), 0) as total,
             COALESCE(SUM(platform_fee), 0) as platform_fee,
             COALESCE(SUM(tenant_payout), 0) as tenant_payout
           FROM ${schemaName}.revenue_records
           WHERE billing_period_start >= NOW() - INTERVAL '12 months'
           GROUP BY TO_CHAR(billing_period_start, 'YYYY-MM')
           ORDER BY month`
                );

                for (const row of rows) {
                    if (!monthlyData[row.month]) {
                        monthlyData[row.month] = { revenue: 0, platformFee: 0, tenantPayout: 0 };
                    }
                    monthlyData[row.month].revenue += parseFloat(row.total) || 0;
                    monthlyData[row.month].platformFee += parseFloat(row.platform_fee) || 0;
                    monthlyData[row.month].tenantPayout += parseFloat(row.tenant_payout) || 0;
                }
            } catch {
                // Schema may not have revenue_records table
            }
        }

        // Convert to sorted array
        const trends = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({
                month,
                revenue: Math.round(data.revenue * 100) / 100,
                platformFee: Math.round(data.platformFee * 100) / 100,
                tenantPayout: Math.round(data.tenantPayout * 100) / 100,
            }));

        res.json({ trends });
    } catch (error) {
        next(error);
    }
});

export default router;
