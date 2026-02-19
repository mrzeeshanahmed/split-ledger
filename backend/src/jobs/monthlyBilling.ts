import { query } from '../../db/index.js';
import { setWithExpiry, getJSON } from '../../db/redis.js';
import { getPaymentProvider } from '../payment/paymentProvider.js';
import { UsageMeterService } from './usageMeter.js';
import { BillingCalculatorService } from './billingCalculator.js';
import { ReconciliationService } from './reconciliation.js';
import { BillingError, BillingResult, BillingJobResult } from '../../types/billing.js';
import type { Tenant } from '../../types/tenant.js';
import { env } from '../../config/env.js';
import logger from '../../utils/logger.js';

export interface BillingJobOptions {
  dryRun?: boolean;
  tenantId?: string;
}

const BILLING_JOB_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export function getBillingPeriodString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getPreviousBillingPeriod(billingPeriod: string): string {
  const [year, month] = billingPeriod.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return getBillingPeriodString(date);
}

export function getBillingPeriodDates(billingPeriod: string): {
  startDate: Date;
  endDate: Date;
} {
  const [year, month] = billingPeriod.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);
  return { startDate, endDate };
}

export async function runMonthlyBilling(
  billingPeriod: string,
  options: BillingJobOptions = {}
): Promise<BillingJobResult> {
  const { dryRun = false, tenantId } = options;
  const startedAt = new Date();

  logger.info({
    message: 'Starting monthly billing job',
    billingPeriod,
    dryRun,
    tenantId,
  });

  const jobKey = `billing_job:${billingPeriod}`;
  const existingJob = await getJSON<{ status: string; result?: BillingJobResult }>(jobKey);

  if (existingJob) {
    if (existingJob.status === 'completed') {
      logger.info({ message: 'Billing job already completed', billingPeriod });
      return existingJob.result!;
    }
    if (existingJob.status === 'in_progress') {
      throw new BillingError('Billing job already in progress', 'IDEMPOTENCY_KEY_EXISTS', 409);
    }
  }

  await setWithExpiry(
    jobKey,
    JSON.stringify({ status: 'in_progress', startedAt: startedAt.toISOString() }),
    BILLING_JOB_TTL_SECONDS
  );

  try {
    let tenantsQuery = `
      SELECT id, name, stripe_customer_id, subscription_plan, 
             subscription_status, billing_email
      FROM tenants 
      WHERE status = 'active' AND subscription_status = 'active'
    `;
    const params: string[] = [];

    if (tenantId) {
      tenantsQuery += ' AND id = $1';
      params.push(tenantId);
    }

    const { rows: tenants } = await query(tenantsQuery, params);

    logger.info({ message: 'Found tenants to bill', count: tenants.length, billingPeriod });

    const results: BillingResult[] = [];
    let successfullyBilled = 0;
    let failedCount = 0;
    const skippedCount = 0;
    let totalRevenueCents = 0;
    let totalPlatformFeeCents = 0;

    for (const tenant of tenants) {
      try {
        const result = await processTenantBilling(tenant, billingPeriod, dryRun);
        results.push(result);

        if (result.success) {
          successfullyBilled++;
          totalRevenueCents += result.grossTotalCents;
          totalPlatformFeeCents += result.platformFeeCents;
        } else {
          failedCount++;
        }
      } catch (error) {
        logger.error({
          message: 'Failed to process tenant billing',
          tenantId: tenant.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failedCount++;
        results.push({
          success: false,
          tenantId: tenant.id,
          billingPeriod,
          charges: [],
          grossTotalCents: 0,
          platformFeeCents: 0,
          netTotalCents: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    const completedAt = new Date();
    const jobResult: BillingJobResult = {
      billingPeriod,
      startedAt,
      completedAt,
      totalTenants: tenants.length,
      successfullyBilled,
      failedCount,
      totalRevenueCents,
      totalPlatformFeeCents,
      results,
    };

    await setWithExpiry(
      jobKey,
      JSON.stringify({ status: 'completed', result: jobResult }),
      BILLING_JOB_TTL_SECONDS
    );

    logger.info({
      message: 'Monthly billing job completed',
      billingPeriod,
      totalTenants: tenants.length,
      successfullyBilled,
      failedCount,
      skippedCount,
      totalRevenueCents,
      dryRun,
    });

    return jobResult;
  } catch (error) {
    await setWithExpiry(
      jobKey,
      JSON.stringify({ status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }),
      BILLING_JOB_TTL_SECONDS
    );

    logger.error({
      message: 'Monthly billing job failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      billingPeriod,
    });

    throw error;
  }
}

async function processTenantBilling(
  tenant: Tenant,
  billingPeriod: string,
  dryRun: boolean
): Promise<BillingResult> {
  const tenantId = tenant.id;
  const tenantSchema = `tenant_${tenantId.replace(/-/g, '_')}`;

  const tenantKey = `billing:${tenantId}:${billingPeriod}`;
  const existingBilling = await getJSON<BillingResult>(tenantKey);

  if (existingBilling) {
    logger.info({ message: 'Tenant already billed for this period', tenantId, billingPeriod });
    return { ...existingBilling, skipped: true } as BillingResult & { skipped?: boolean };
  }

  logger.info({ message: 'Processing tenant billing', tenantId, billingPeriod, plan: tenant.subscription_plan });

  const { startDate, endDate } = getBillingPeriodDates(billingPeriod);

  let usageAggregations: { metric: string; totalQuantity: number; totalCostCents: number }[] = [];

  try {
    usageAggregations = await UsageMeterService.getUsageForPeriod(tenantSchema, { startDate, endDate });
  } catch (error) {
    logger.warn({
      message: 'Could not retrieve usage data, using zero',
      tenantId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const calculation = BillingCalculatorService.calculateBilling(
    tenant.subscription_plan,
    usageAggregations,
    env.PLATFORM_FEE_PERCENT
  );

  const charges = [
    { type: 'subscription' as const, amountCents: calculation.subscriptionChargeCents },
    ...calculation.overageCharges.map((charge) => ({ type: 'overage' as const, amountCents: charge.overageCostCents })),
  ];

  if (calculation.totalCents === 0) {
    logger.info({ message: 'No charges for tenant (free plan)', tenantId, billingPeriod });

    await ReconciliationService.recordRevenue({
      tenantId,
      billingPeriod,
      chargeType: 'subscription',
      grossAmountCents: 0,
      platformFeeCents: 0,
      netAmountCents: 0,
      description: 'Free plan - no charges',
      status: 'completed',
    });

    await setWithExpiry(tenantKey, JSON.stringify({ success: true, dryRun }), BILLING_JOB_TTL_SECONDS);

    return { success: true, tenantId, billingPeriod, charges, grossTotalCents: 0, platformFeeCents: 0, netTotalCents: 0 };
  }

  if (dryRun) {
    logger.info({ message: 'Dry run - skipping actual charges', tenantId, totalCents: calculation.totalCents });
    return {
      success: true,
      tenantId,
      billingPeriod,
      charges,
      grossTotalCents: calculation.totalCents,
      platformFeeCents: calculation.platformFeeCents,
      netTotalCents: calculation.netAmountCents,
    };
  }

  if (!tenant.stripe_customer_id) {
    logger.warn({ message: 'Tenant has no Stripe customer ID', tenantId });
    return {
      success: false,
      tenantId,
      billingPeriod,
      charges,
      grossTotalCents: calculation.totalCents,
      platformFeeCents: calculation.platformFeeCents,
      netTotalCents: calculation.netAmountCents,
      errors: ['No Stripe customer ID'],
    };
  }

  const idempotencyKey = `charge_${tenantId}_${billingPeriod}_${Date.now()}`;
  const paymentProvider = getPaymentProvider();

  const chargeResult = await paymentProvider.createCharge({
    amountCents: calculation.totalCents,
    customerId: tenant.stripe_customer_id,
    description: `Monthly billing - ${billingPeriod}`,
    metadata: { tenantId, billingPeriod, chargeType: 'monthly' },
    idempotencyKey,
  });

  if (!chargeResult.success) {
    logger.error({ message: 'Payment charge failed', tenantId, error: chargeResult.error?.message });
    return {
      success: false,
      tenantId,
      billingPeriod,
      charges,
      grossTotalCents: calculation.totalCents,
      platformFeeCents: calculation.platformFeeCents,
      netTotalCents: calculation.netAmountCents,
      errors: [chargeResult.error?.message || 'Payment failed'],
    };
  }

  let transferResult;
  const tenantStripeAccountId = (tenant as Tenant & { stripe_account_id?: string }).stripe_account_id;

  if (tenantStripeAccountId && calculation.netAmountCents > 0) {
    const transferIdempotencyKey = `transfer_${tenantId}_${billingPeriod}_${Date.now()}`;
    transferResult = await paymentProvider.createTransfer({
      amountCents: calculation.netAmountCents,
      destinationAccountId: tenantStripeAccountId,
      description: `Payout - ${billingPeriod}`,
      metadata: { tenantId, billingPeriod },
      idempotencyKey: transferIdempotencyKey,
    });

    if (!transferResult.success) {
      logger.error({ message: 'Transfer to tenant failed', tenantId, error: transferResult.error?.message });
    }
  }

  await ReconciliationService.recordRevenue({
    tenantId,
    billingPeriod,
    chargeType: 'usage',
    grossAmountCents: calculation.totalCents,
    platformFeeCents: calculation.platformFeeCents,
    netAmountCents: calculation.netAmountCents,
    stripeChargeId: chargeResult.chargeId,
    stripeTransferId: transferResult?.transferId,
    stripeCustomerId: tenant.stripe_customer_id,
    description: `Monthly billing - ${billingPeriod}`,
    status: 'completed',
    metadata: { charges: charges.map((c) => ({ type: c.type, amount: c.amountCents })) },
  });

  await setWithExpiry(tenantKey, JSON.stringify({ success: true }), BILLING_JOB_TTL_SECONDS);

  logger.info({
    message: 'Tenant billing completed',
    tenantId,
    billingPeriod,
    grossTotalCents: calculation.totalCents,
    platformFeeCents: calculation.platformFeeCents,
    netTotalCents: calculation.netAmountCents,
  });

  return {
    success: true,
    tenantId,
    billingPeriod,
    charges,
    grossTotalCents: calculation.totalCents,
    platformFeeCents: calculation.platformFeeCents,
    netTotalCents: calculation.netAmountCents,
    stripeChargeId: chargeResult.chargeId,
    stripeTransferId: transferResult?.transferId,
  };
}
