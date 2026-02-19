import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { requireTenant } from '../middleware/tenantContext.js';
import { UsageMeterService } from '../services/billing/usageMeter.js';
import { BillingCalculatorService } from '../services/billing/billingCalculator.js';
import { ReconciliationService } from '../services/billing/reconciliation.js';
import { triggerManualBilling } from '../jobs/scheduler.js';
import { getBillingPeriodDates } from '../jobs/monthlyBilling.js';
import { ValidationError } from '../errors/index.js';
import {
  recordUsageSchema,
  getUsageQuerySchema,
  runBillingSchema,
  reconciliationQuerySchema,
  revenueQuerySchema,
} from '../validation/billing.validation.js';

const router = Router({ mergeParams: true });

router.post(
  '/usage',
  requireTenant,
  requireAuth,
  validate(recordUsageSchema),
  async (req, res, next) => {
    try {
      const { metric, quantity, unitPriceCents, metadata, recordedAt } = req.body;
      const tenantSchema = req.tenantSchema!;

      const usageId = await UsageMeterService.recordUsage({
        tenantSchema,
        metric,
        quantity,
        unitPriceCents,
        metadata,
        recordedAt: recordedAt ? new Date(recordedAt) : undefined,
      });

      res.status(201).json({
        id: usageId,
        metric,
        quantity,
        unitPriceCents,
        metadata,
        recordedAt: recordedAt || new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/usage',
  requireTenant,
  requireAuth,
  validate(getUsageQuerySchema),
  async (req, res, next) => {
    try {
      const { startDate, endDate, metric } = req.query as {
        startDate: string;
        endDate: string;
        metric?: string;
      };
      const tenantSchema = req.tenantSchema!;

      const usageAggregations = await UsageMeterService.getUsageForPeriod(tenantSchema, {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        metric,
      });

      res.json({ startDate, endDate, metrics: usageAggregations });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/usage/details',
  requireTenant,
  requireAuth,
  validate(getUsageQuerySchema),
  async (req, res, next) => {
    try {
      const { startDate, endDate, metric } = req.query as {
        startDate: string;
        endDate: string;
        metric?: string;
      };
      const limitVal = parseInt(req.query.limit as string || '100', 10);
      const offsetVal = parseInt(req.query.offset as string || '0', 10);
      const tenantSchema = req.tenantSchema!;

      const result = await UsageMeterService.getUsageDetails(tenantSchema, {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        metric,
        limit: limitVal,
        offset: offsetVal,
      });

      res.json({
        startDate,
        endDate,
        total: result.total,
        records: result.records.map((r) => ({
          id: r.id,
          metric: r.metric,
          quantity: r.quantity,
          unitPriceCents: r.unitPriceCents,
          totalPriceCents: r.totalPriceCents,
          metadata: r.metadata,
          recordedAt: r.recordedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/preview',
  requireTenant,
  requireAuth,
  async (req, res, next) => {
    try {
      const billingPeriod = (req.query.period as string) || getCurrentBillingPeriod();
      const { startDate, endDate } = getBillingPeriodDates(billingPeriod);
      const tenantSchema = req.tenantSchema!;

      const usageAggregations = await UsageMeterService.getUsageForPeriod(tenantSchema, { startDate, endDate });
      const subscriptionPlan = (req as any).user?.subscriptionPlan || 'free';

      const preview = BillingCalculatorService.previewBilling(subscriptionPlan, usageAggregations);

      res.json({ billingPeriod, startDate: startDate.toISOString(), endDate: endDate.toISOString(), ...preview });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/run',
  requireAuth,
  requireRole('admin'),
  validate(runBillingSchema),
  async (req, res, next) => {
    try {
      const { billingPeriod, dryRun, tenantId } = req.body;
      const result = await triggerManualBilling(billingPeriod, { dryRun, tenantId });

      res.json({
        success: true,
        billingPeriod: billingPeriod || getCurrentBillingPeriod(),
        dryRun,
        summary: {
          totalTenants: (result as any).totalTenants,
          successfullyBilled: (result as any).successfullyBilled,
          failedCount: (result as any).failedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/reconciliation',
  requireAuth,
  requireRole('admin'),
  validate(reconciliationQuerySchema),
  async (req, res, next) => {
    try {
      const { billingPeriod } = req.query as { billingPeriod: string };
      const report = await ReconciliationService.reconcilePeriod(billingPeriod);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/revenue',
  requireAuth,
  requireRole('admin'),
  validate(revenueQuerySchema),
  async (req, res, next) => {
    try {
      const { billingPeriod, tenantId, status, limit: limitStr, offset: offsetStr } = req.query as {
        billingPeriod: string;
        tenantId?: string;
        status?: string;
        limit?: string;
        offset?: string;
      };
      const limitVal = parseInt(limitStr || '50', 10);
      const offsetVal = parseInt(offsetStr || '0', 10);

      const result = await ReconciliationService.getRevenueRecords(billingPeriod, { tenantId, status, limit: limitVal, offset: offsetVal });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/revenue/summary',
  requireAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const billingPeriod = req.query.period as string;
      if (!billingPeriod) throw new ValidationError('billingPeriod query parameter is required');

      const summary = await ReconciliationService.getRevenueSummary(billingPeriod);
      res.json({ billingPeriod, ...summary });
    } catch (error) {
      next(error);
    }
  }
);

function getCurrentBillingPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default router;
