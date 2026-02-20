import { randomUUID } from 'crypto';
import { tenantDb } from '../../db/tenantClient.js';
import logger from '../../utils/logger.js';
import { BillingError } from '../../types/billing.js';

export interface RecordUsageInput {
  tenantSchema: string;
  metric: string;
  quantity: number;
  unitPriceCents?: number;
  metadata?: Record<string, unknown>;
  recordedAt?: Date;
}

export interface UsageQueryOptions {
  startDate: Date;
  endDate: Date;
  metric?: string;
}

/**
 * Usage Metering Service
 * Handles recording and aggregating usage data in tenant schemas
 */
export class UsageMeterService {
  /**
   * Record a usage event for a tenant
   */
  static async recordUsage(input: RecordUsageInput): Promise<string> {
    const { tenantSchema, metric, quantity, unitPriceCents = 0, metadata = {}, recordedAt } = input;

    if (quantity < 0) {
      throw new BillingError(
        'Quantity must be non-negative',
        'USAGE_RECORD_FAILED',
        400
      );
    }

    const totalPriceCents = Math.round(quantity * unitPriceCents);
    const timestamp = recordedAt || new Date();

    try {
      const { rows } = await tenantDb.query(
        tenantSchema,
        `INSERT INTO usage_records (id, metric, quantity, unit_price_cents, total_price_cents, metadata, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          randomUUID(),
          metric,
          quantity,
          unitPriceCents,
          totalPriceCents,
          JSON.stringify(metadata),
          timestamp,
        ]
      );

      logger.info({
        message: 'Usage recorded',
        tenantSchema,
        metric,
        quantity,
        totalPriceCents,
        recordedAt: timestamp,
      });

      return rows[0].id;
    } catch (error) {
      logger.error({
        message: 'Failed to record usage',
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantSchema,
        metric,
      });
      throw new BillingError(
        'Failed to record usage',
        'USAGE_RECORD_FAILED',
        500
      );
    }
  }

  /**
   * Get aggregated usage for a tenant within a date range
   */
  static async getUsageForPeriod(
    tenantSchema: string,
    options: UsageQueryOptions
  ): Promise<{ metric: string; totalQuantity: number; totalCostCents: number }[]> {
    const { startDate, endDate, metric } = options;

    let query = `
      SELECT 
        metric,
        SUM(quantity) as total_quantity,
        SUM(total_price_cents) as total_cost_cents
      FROM usage_records
      WHERE recorded_at >= $1 AND recorded_at < $2
    `;

    const params: (Date | string)[] = [startDate, endDate];

    if (metric) {
      query += ` AND metric = $3`;
      params.push(metric);
    }

    query += ` GROUP BY metric ORDER BY metric`;

    try {
      const { rows } = await tenantDb.query(tenantSchema, query, params);

      return rows.map((row) => ({
        metric: row.metric,
        totalQuantity: parseInt(row.total_quantity, 10),
        totalCostCents: parseInt(row.total_cost_cents, 10),
      }));
    } catch (error) {
      logger.error({
        message: 'Failed to get usage for period',
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantSchema,
        startDate,
        endDate,
      });
      throw new BillingError(
        'Failed to retrieve usage data',
        'USAGE_RECORD_FAILED',
        500
      );
    }
  }

  /**
   * Get detailed usage records for a tenant
   */
  static async getUsageDetails(
    tenantSchema: string,
    options: UsageQueryOptions & { limit?: number; offset?: number }
  ): Promise<{
    records: {
      id: string;
      metric: string;
      quantity: number;
      unitPriceCents: number;
      totalPriceCents: number;
      metadata: Record<string, unknown>;
      recordedAt: Date;
    }[];
    total: number;
  }> {
    const { startDate, endDate, metric, limit = 100, offset = 0 } = options;

    let whereClause = `WHERE recorded_at >= $1 AND recorded_at < $2`;
    const params: (Date | string | number)[] = [startDate, endDate];

    if (metric) {
      whereClause += ` AND metric = $3`;
      params.push(metric);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM usage_records
      ${whereClause}
    `;

    // Get records
    const dataQuery = `
      SELECT id, metric, quantity, unit_price_cents, total_price_cents, metadata, recorded_at
      FROM usage_records
      ${whereClause}
      ORDER BY recorded_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    try {
      const [countResult, dataResult] = await Promise.all([
        tenantDb.query(tenantSchema, countQuery, params),
        tenantDb.query(tenantSchema, dataQuery, [...params, limit, offset]),
      ]);

      const total = parseInt(countResult.rows[0].total, 10);

      return {
        records: dataResult.rows.map((row) => ({
          id: row.id,
          metric: row.metric,
          quantity: row.quantity,
          unitPriceCents: row.unit_price_cents,
          totalPriceCents: row.total_price_cents,
          metadata: row.metadata,
          recordedAt: row.recorded_at,
        })),
        total,
      };
    } catch (error) {
      logger.error({
        message: 'Failed to get usage details',
        error: error instanceof Error ? error.message : 'Unknown error',
        tenantSchema,
      });
      throw new BillingError(
        'Failed to retrieve usage details',
        'USAGE_RECORD_FAILED',
        500
      );
    }
  }

  /**
   * Get total usage for a specific metric within a period
   */
  static async getTotalUsageByMetric(
    tenantSchema: string,
    metric: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ totalQuantity: number; totalCostCents: number }> {
    const { rows } = await tenantDb.query(
      tenantSchema,
      `SELECT 
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(total_price_cents), 0) as total_cost_cents
      FROM usage_records
      WHERE metric = $1 AND recorded_at >= $2 AND recorded_at < $3`,
      [metric, startDate, endDate]
    );

    return {
      totalQuantity: parseInt(rows[0].total_quantity, 10),
      totalCostCents: parseInt(rows[0].total_cost_cents, 10),
    };
  }
}
