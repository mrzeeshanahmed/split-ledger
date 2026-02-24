import { query } from '../../db';

export interface MRRSnapshot {
  snapshotDate: string;
  totalMrr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  activeSubscriptions: number;
}

/**
 * Service to handle MRR calculations and tracking.
 */
export class MRRService {
  /**
   * Sums all active subscription prices from tenants table
   */
  async calculateCurrentMRR(): Promise<{ totalMrr: number; activeSubscriptions: number }> {
    const result = await query(
      `SELECT 
         COALESCE(SUM(current_mrr), 0) as total_mrr, 
         COUNT(*) as active_sub_count 
       FROM tenants 
       WHERE status = 'active'`
    );

    return {
      totalMrr: parseInt(result.rows[0].total_mrr, 10),
      activeSubscriptions: parseInt(result.rows[0].active_sub_count, 10)
    };
  }

  /**
   * Runs daily to calculate and write the snapshot to mrr_snapshots table
   */
  async snapshotMRR(): Promise<void> {
    const { totalMrr, activeSubscriptions } = await this.calculateCurrentMRR();
    const snapshotDate = new Date().toISOString().split('T')[0];

    // For a real system we would calculate new/expansion/contraction/churned 
    // based on tenant_events from the previous 24 hours. For now, we stub them.
    const newMrr = 0;
    const expansionMrr = 0;
    const contractionMrr = 0;
    const churnedMrr = 0;

    await query(
      `INSERT INTO mrr_snapshots 
        (snapshot_date, total_mrr, new_mrr, expansion_mrr, contraction_mrr, churned_mrr, active_subscriptions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (snapshot_date) DO UPDATE SET
        total_mrr = EXCLUDED.total_mrr,
        active_subscriptions = EXCLUDED.active_subscriptions,
        new_mrr = EXCLUDED.new_mrr,
        expansion_mrr = EXCLUDED.expansion_mrr,
        contraction_mrr = EXCLUDED.contraction_mrr,
        churned_mrr = EXCLUDED.churned_mrr`,
      [snapshotDate, totalMrr, newMrr, expansionMrr, contractionMrr, churnedMrr, activeSubscriptions]
    );
  }

  /**
   * Returns daily MRR data for a given date range
   */
  async getMRRHistory(startDate: string, endDate: string): Promise<MRRSnapshot[]> {
    const result = await query(
      `SELECT 
         TO_CHAR(snapshot_date, 'YYYY-MM-DD') as "snapshotDate",
         total_mrr as "totalMrr",
         new_mrr as "newMrr",
         expansion_mrr as "expansionMrr",
         contraction_mrr as "contractionMrr",
         churned_mrr as "churnedMrr",
         active_subscriptions as "activeSubscriptions"
       FROM mrr_snapshots
       WHERE snapshot_date >= $1 AND snapshot_date <= $2
       ORDER BY snapshot_date ASC`,
      [startDate, endDate]
    );

    return result.rows.map((r: any) => ({
      ...r,
      totalMrr: parseInt(r.totalMrr, 10),
      newMrr: parseInt(r.newMrr, 10),
      expansionMrr: parseInt(r.expansionMrr, 10),
      contractionMrr: parseInt(r.contractionMrr, 10),
      churnedMrr: parseInt(r.churnedMrr, 10),
      activeSubscriptions: parseInt(r.activeSubscriptions, 10)
    }));
  }

  /**
   * Summarizes new/expansion/contraction/churned MRR for a period
   */
  async getMRRBreakdown(startDate: string, endDate: string): Promise<Omit<MRRSnapshot, 'snapshotDate' | 'totalMrr' | 'activeSubscriptions'>> {
    const result = await query(
      `SELECT 
         COALESCE(SUM(new_mrr), 0) as "newMrr",
         COALESCE(SUM(expansion_mrr), 0) as "expansionMrr",
         COALESCE(SUM(contraction_mrr), 0) as "contractionMrr",
         COALESCE(SUM(churned_mrr), 0) as "churnedMrr"
       FROM mrr_snapshots
       WHERE snapshot_date >= $1 AND snapshot_date <= $2`,
      [startDate, endDate]
    );

    return {
      newMrr: parseInt(result.rows[0].newMrr, 10),
      expansionMrr: parseInt(result.rows[0].expansionMrr, 10),
      contractionMrr: parseInt(result.rows[0].contractionMrr, 10),
      churnedMrr: parseInt(result.rows[0].churnedMrr, 10)
    };
  }
}

export const mrrService = new MRRService();
