import cron from 'node-cron';
import { runMonthlyBilling, getBillingPeriodString } from './monthlyBilling.js';
import logger from '../utils/logger.js';

let scheduler: any = null;

const SCHEDULE_CRON = '5 0 1 * *'; // Run at 00:05 UTC on the 1st of each month

/**
 * Start the billing scheduler
 * Runs monthly billing job on the 1st of each month at 00:05 UTC
 */
export function startScheduler(): void {
  if (scheduler) {
    logger.warn({
      message: 'Billing scheduler already running',
    });
    return;
  }

  // Schedule the monthly billing job
  scheduler = cron.schedule(SCHEDULE_CRON, async () => {
    const billingPeriod = getBillingPeriodString(new Date());

    logger.info({
      message: 'Scheduled billing job triggered',
      billingPeriod,
    });

    try {
      const result = await runMonthlyBilling(billingPeriod);

      logger.info({
        message: 'Scheduled billing job completed',
        billingPeriod,
        totalTenants: result.totalTenants,
        successfullyBilled: result.successfullyBilled,
        failedCount: result.failedCount,
      });
    } catch (error) {
      logger.error({
        message: 'Scheduled billing job failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        billingPeriod,
      });
    }
  });

  logger.info({
    message: 'Billing scheduler started',
    schedule: SCHEDULE_CRON,
    description: 'Runs at 00:05 UTC on the 1st of each month',
  });
}

/**
 * Stop the billing scheduler
 */
export function stopScheduler(): void {
  if (scheduler) {
    scheduler.stop();
    scheduler = null;
    logger.info({
      message: 'Billing scheduler stopped',
    });
  }
}

/**
 * Manually trigger billing for a specific period
 * Useful for testing or catching up missed billing runs
 */
export async function triggerManualBilling(
  billingPeriod?: string,
  options?: { dryRun?: boolean; tenantId?: string }
): Promise<void> {
  const period = billingPeriod || getBillingPeriodString(new Date());

  logger.info({
    message: 'Manual billing triggered',
    billingPeriod: period,
    dryRun: options?.dryRun,
    tenantId: options?.tenantId,
  });

  try {
    const result = await runMonthlyBilling(period, options);

    logger.info({
      message: 'Manual billing completed',
      billingPeriod: period,
      totalTenants: result.totalTenants,
      successfullyBilled: result.successfullyBilled,
      failedCount: result.failedCount,
    });
  } catch (error) {
    logger.error({
      message: 'Manual billing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      billingPeriod: period,
    });
    throw error;
  }
}

export { SCHEDULE_CRON };
