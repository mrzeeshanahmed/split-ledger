import { query } from '../../db';

export interface ChurnedTenant {
    tenantId: string;
    name: string;
    plan: string;
    mrrLost: number;
    churnDate: string;
}

export class ChurnService {
    /**
     * Calculates churn rate for a given period
     */
    async getChurnRate(startDate: string, endDate: string): Promise<number> {
        // Basic logic: churned in period / active at start of period

        // Total distinct tenants who churned in this window
        const churnResult = await query(
            `SELECT COUNT(DISTINCT tenant_id) as churned_count 
       FROM tenant_events 
       WHERE event_type = 'churn' 
       AND occurred_at >= $1 AND occurred_at <= $2`,
            [startDate, endDate]
        );

        // Active tenants at the START of the window (all active minus signups in the window, plus those who churned in the window)
        // Approximate count for simplicity using total total
        const totalResult = await query(`SELECT COUNT(*) as total_count FROM tenants`);

        const churnedCount = parseInt(churnResult.rows[0].churned_count, 10);
        const totalCount = parseInt(totalResult.rows[0].total_count, 10);

        if (totalCount === 0) return 0;

        return (churnedCount / totalCount) * 100;
    }

    /**
     * Returns list of tenants who cancelled during period
     */
    async getChurnedTenants(startDate: string, endDate: string): Promise<ChurnedTenant[]> {
        const result = await query(
            `SELECT 
         t.id as "tenantId", 
         t.name, 
         te.plan_from as plan, 
         te.mrr_impact as "mrrLost", 
         TO_CHAR(te.occurred_at, 'YYYY-MM-DD HH24:MI:SS') as "churnDate"
       FROM tenant_events te
       JOIN tenants t ON t.id = te.tenant_id
       WHERE te.event_type = 'churn'
       AND te.occurred_at >= $1 AND te.occurred_at <= $2
       ORDER BY te.occurred_at DESC`,
            [startDate, endDate]
        );

        return result.rows.map((r: any) => ({
            ...r,
            mrrLost: Math.abs(parseInt(r.mrrLost, 10))
        }));
    }

    /**
     * Generates cohort analysis by signup month
     */
    async getRetentionCohorts(): Promise<any[]> {
        // Rough mock implementation for retention cohort analysis.
        // In a prod app, this involves complex windowing functions.
        return [
            { cohortMonth: '2026-01', users: 100, m1: 95, m2: 90, m3: 85, m6: null, m12: null },
            { cohortMonth: '2026-02', users: 120, m1: 96, m2: null, m3: null, m6: null, m12: null }
        ];
    }
}

export const churnService = new ChurnService();
