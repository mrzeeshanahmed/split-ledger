import { query } from '../../db/index.js';
import logger from '../../utils/logger.js';
import { BillingError, ReconciliationReport } from '../../types/billing.js';
import { getPaymentProvider } from '../payment/paymentProvider.js';

export interface RevenueSummary {
  totalCharges: number;
  completedCharges: number;
  pendingCharges: number;
  failedCharges: number;
  totalAmountCents: number;
  completedAmountCents: number;
  pendingAmountCents: number;
}

/**
 * Reconciliation Service
 * Compares internal revenue records with Stripe data
 */
export class ReconciliationService {
  /**
   * Get revenue summary from internal records
   */
  static async getRevenueSummary(billingPeriod: string): Promise<RevenueSummary> {
    const { rows } = await query(
      `SELECT 
        COUNT(*) as total_charges,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_charges,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_charges,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_charges,
        COALESCE(SUM(gross_amount_cents), 0) as total_amount,
        COALESCE(SUM(gross_amount_cents) FILTER (WHERE status = 'completed'), 0) as completed_amount,
        COALESCE(SUM(gross_amount_cents) FILTER (WHERE status = 'pending'), 0) as pending_amount
      FROM revenue_records 
      WHERE billing_period = $1`,
      [billingPeriod]
    );

    return {
      totalCharges: parseInt(rows[0].total_charges, 10),
      completedCharges: parseInt(rows[0].completed_charges, 10),
      pendingCharges: parseInt(rows[0].pending_charges, 10),
      failedCharges: parseInt(rows[0].failed_charges, 10),
      totalAmountCents: parseInt(rows[0].total_amount, 10),
      completedAmountCents: parseInt(rows[0].completed_amount, 10),
      pendingAmountCents: parseInt(rows[0].pending_amount, 10),
    };
  }

  /**
   * Get revenue records for a specific period
   */
  static async getRevenueRecords(
    billingPeriod: string,
    options?: {
      tenantId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    records: {
      id: string;
      tenantId: string;
      billingPeriod: string;
      chargeType: string;
      grossAmountCents: number;
      platformFeeCents: number;
      netAmountCents: number;
      status: string;
      stripeChargeId?: string;
      description?: string;
      createdAt: Date;
    }[];
    total: number;
  }> {
    let whereClause = 'WHERE billing_period = $1';
    const params: (string | number)[] = [billingPeriod];
    let paramIndex = 2;

    if (options?.tenantId) {
      whereClause += ` AND tenant_id = $${paramIndex}`;
      params.push(options.tenantId);
      paramIndex++;
    }

    if (options?.status) {
      whereClause += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM revenue_records ${whereClause}`;
    const dataQuery = `
      SELECT id, tenant_id, billing_period, charge_type, gross_amount_cents, 
             platform_fee_cents, net_amount_cents, status, stripe_charge_id, 
             description, created_at
      FROM revenue_records
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    try {
      const [countResult, dataResult] = await Promise.all([
        query(countQuery, params),
        query(dataQuery, [...params, limit, offset]),
      ]);

      return {
        records: dataResult.rows.map((row) => ({
          id: row.id,
          tenantId: row.tenant_id,
          billingPeriod: row.billing_period,
          chargeType: row.charge_type,
          grossAmountCents: row.gross_amount_cents,
          platformFeeCents: row.platform_fee_cents,
          netAmountCents: row.net_amount_cents,
          status: row.status,
          stripeChargeId: row.stripe_charge_id,
          description: row.description,
          createdAt: row.created_at,
        })),
        total: parseInt(countResult.rows[0].count, 10),
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get revenue records',
        error: error instanceof Error ? error.message : 'Unknown error',
        billingPeriod,
      });
      throw new BillingError(
        'Failed to retrieve revenue records',
        'RECONCILIATION_FAILED',
        500
      );
    }
  }

  /**
   * Generate reconciliation report for a billing period
   */
  static async reconcilePeriod(billingPeriod: string): Promise<ReconciliationReport> {
    logger.info({
      message: 'Starting reconciliation',
      billingPeriod,
    });

    try {
      // Get internal revenue summary
      const revenueSummary = await this.getRevenueSummary(billingPeriod);

      // Try to get Stripe data (may fail in test environment)
      let stripeData: { totalCharges: number; totalAmountCents: number } | undefined;

      try {
        const paymentProvider = getPaymentProvider();
        const balance = await paymentProvider.getBalance();
        
        // For Stripe, we would need to query the Stripe API for charges
        // This is a simplified version - in production you'd query Stripe API
        stripeData = {
          totalCharges: revenueSummary.totalCharges,
          totalAmountCents: balance.pending + balance.available,
        };
      } catch (error) {
        logger.warn({
          message: 'Could not retrieve Stripe data for reconciliation',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Find discrepancies
      const discrepancies: ReconciliationReport['discrepancies']['details'] = [];

      // Check for completed charges in DB but not in Stripe
      // (Simplified - in production would query Stripe API directly)
      if (stripeData) {
        const dbCompletedAmount = revenueSummary.completedAmountCents;
        
        if (Math.abs(dbCompletedAmount - stripeData.totalAmountCents) > 1) {
          discrepancies.push({
            tenantId: 'PLATFORM',
            type: 'amount_mismatch',
            expectedAmountCents: dbCompletedAmount,
            actualAmountCents: stripeData.totalAmountCents,
          });
        }
      }

      const report: ReconciliationReport = {
        billingPeriod,
        generatedAt: new Date(),
        revenueRecords: revenueSummary,
        stripeData,
        discrepancies: {
          count: discrepancies.length,
          details: discrepancies,
        },
      };

      logger.info({
        message: 'Reconciliation complete',
        billingPeriod,
        totalCharges: revenueSummary.totalCharges,
        discrepancies: discrepancies.length,
      });

      return report;
    } catch (error) {
      logger.error({
        message: 'Reconciliation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        billingPeriod,
      });
      throw new BillingError(
        'Reconciliation failed',
        'RECONCILIATION_FAILED',
        500
      );
    }
  }

  /**
   * Record a revenue transaction
   */
  static async recordRevenue(params: {
    tenantId: string;
    billingPeriod: string;
    chargeType: 'subscription' | 'usage' | 'overage' | 'adjustment';
    grossAmountCents: number;
    platformFeeCents: number;
    netAmountCents: number;
    stripeChargeId?: string;
    stripeTransferId?: string;
    stripeCustomerId?: string;
    description?: string;
    status?: 'pending' | 'completed' | 'failed';
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const {
      tenantId,
      billingPeriod,
      chargeType,
      grossAmountCents,
      platformFeeCents,
      netAmountCents,
      stripeChargeId,
      stripeTransferId,
      stripeCustomerId,
      description,
      status = 'pending',
      metadata = {},
    } = params;

    try {
      const { rows } = await query(
        `INSERT INTO revenue_records (
          tenant_id, billing_period, charge_type, gross_amount_cents, 
          platform_fee_cents, net_amount_cents, stripe_charge_id, 
          stripe_transfer_id, stripe_customer_id, description, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id`,
        [
          tenantId,
          billingPeriod,
          chargeType,
          grossAmountCents,
          platformFeeCents,
          netAmountCents,
          stripeChargeId,
          stripeTransferId,
          stripeCustomerId,
          description,
          status,
          JSON.stringify(metadata),
        ]
      );

      logger.info({
        message: 'Revenue recorded',
        revenueId: rows[0].id,
        tenantId,
        billingPeriod,
        chargeType,
        grossAmountCents,
      });

      return rows[0].id;
    } catch (error) {
      logger.error({
        message: 'Failed to record revenue',
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantId,
        billingPeriod,
      });
      throw new BillingError(
        'Failed to record revenue',
        'BILLING_CALCULATION_FAILED',
        500
      );
    }
  }

  /**
   * Update revenue record status
   */
  static async updateRevenueStatus(
    revenueId: string,
    status: 'pending' | 'completed' | 'failed' | 'refunded',
    stripeChargeId?: string,
    stripeTransferId?: string
  ): Promise<void> {
    const updates: string[] = ['status = $2'];
    const params: (string | undefined)[] = [revenueId, status];
    let paramIndex = 3;

    if (stripeChargeId) {
      updates.push(`stripe_charge_id = $${paramIndex}`);
      params.push(stripeChargeId);
      paramIndex++;
    }

    if (stripeTransferId) {
      updates.push(`stripe_transfer_id = $${paramIndex}`);
      params.push(stripeTransferId);
      paramIndex++;
    }

    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
    }

    try {
      await query(
        `UPDATE revenue_records SET ${updates.join(', ')} WHERE id = $1`,
        params
      );

      logger.info({
        message: 'Revenue status updated',
        revenueId,
        status,
      });
    } catch (error) {
      logger.error({
        message: 'Failed to update revenue status',
        error: error instanceof Error ? error.message : 'Unknown error',
        revenueId,
      });
      throw new BillingError(
        'Failed to update revenue status',
        'BILLING_CALCULATION_FAILED',
        500
      );
    }
  }
}
