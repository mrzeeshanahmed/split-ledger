import { SubscriptionPlan } from '../../types/tenant.js';
import { UsageAggregation } from '../../types/billing.js';
import { getPlan, getOveragePriceApiCalls, getOveragePriceStorageMb, getIncludedApiCalls, getIncludedStorageMb } from '../../config/plans.js';

export interface OverageCalculation {
  metric: string;
  includedQuantity: number;
  usedQuantity: number;
  overageQuantity: number;
  overageCostCents: number;
}

export interface BillingCalculation {
  basePriceCents: number;
  subscriptionChargeCents: number;
  overageCharges: OverageCalculation[];
  totalOverageCents: number;
  totalCents: number;
  platformFeeCents: number;
  netAmountCents: number;
}

/**
 * Billing Calculator Service
 * Handles all billing calculations including overage and platform fees
 */
export class BillingCalculatorService {
  /**
   * Calculate overage charges for usage
   */
  static calculateOverage(
    usageAggregations: UsageAggregation[],
    plan: SubscriptionPlan
  ): OverageCalculation[] {
    const overageCharges: OverageCalculation[] = [];

    for (const usage of usageAggregations) {
      let includedQuantity = 0;
      let overagePriceCents = 0;

      switch (usage.metric) {
        case 'api_calls':
          includedQuantity = getIncludedApiCalls(plan);
          overagePriceCents = getOveragePriceApiCalls(plan);
          break;
        case 'storage_mb':
          includedQuantity = getIncludedStorageMb(plan);
          overagePriceCents = getOveragePriceStorageMb(plan);
          break;
        default:
          // For unknown metrics, charge based on quantity
          includedQuantity = 0;
          overagePriceCents = 0;
      }

      const overageQuantity = Math.max(0, usage.totalQuantity - includedQuantity);
      const overageCostCents = Math.round(overageQuantity * overagePriceCents);

      if (overageQuantity > 0) {
        overageCharges.push({
          metric: usage.metric,
          includedQuantity,
          usedQuantity: usage.totalQuantity,
          overageQuantity,
          overageCostCents,
        });
      }
    }

    return overageCharges;
  }

  /**
   * Calculate platform fee from gross amount
   */
  static calculatePlatformFee(grossAmountCents: number, feePercent: number = 20): number {
    return Math.round(grossAmountCents * (feePercent / 100));
  }

  /**
   * Calculate net amount after platform fee
   */
  static calculateNetAmount(grossAmountCents: number, platformFeeCents: number): number {
    return Math.max(0, grossAmountCents - platformFeeCents);
  }

  /**
   * Calculate complete billing for a tenant
   */
  static calculateBilling(
    plan: SubscriptionPlan,
    usageAggregations: UsageAggregation[],
    platformFeePercent: number = 20
  ): BillingCalculation {
    const planConfig = getPlan(plan);
    const basePriceCents = planConfig.basePriceCents;

    // Calculate overage charges
    const overageCharges = this.calculateOverage(usageAggregations, plan);
    const totalOverageCents = overageCharges.reduce((sum, charge) => sum + charge.overageCostCents, 0);

    // Calculate total
    const subscriptionChargeCents = basePriceCents;
    const totalCents = subscriptionChargeCents + totalOverageCents;

    // Calculate platform fee and net
    const platformFeeCents = this.calculatePlatformFee(totalCents, platformFeePercent);
    const netAmountCents = this.calculateNetAmount(totalCents, platformFeeCents);

    return {
      basePriceCents,
      subscriptionChargeCents,
      overageCharges,
      totalOverageCents,
      totalCents,
      platformFeeCents,
      netAmountCents,
    };
  }

  /**
   * Calculate what the billing would be without actually charging (preview)
   */
  static previewBilling(
    plan: SubscriptionPlan,
    usageAggregations: UsageAggregation[],
    platformFeePercent: number = 20
  ): {
    plan: SubscriptionPlan;
    planName: string;
    basePriceFormatted: string;
    overageBreakdown: {
      metric: string;
      includedQuantity: number;
      usedQuantity: number;
      overageQuantity: number;
      overageCostFormatted: string;
    }[];
    totalOverageFormatted: string;
    totalFormatted: string;
    platformFeeFormatted: string;
    netFormatted: string;
  } {
    const calculation = this.calculateBilling(plan, usageAggregations, platformFeePercent);
    const planConfig = getPlan(plan);

    const formatCents = (cents: number): string => {
      return `$${(cents / 100).toFixed(2)}`;
    };

    return {
      plan,
      planName: planConfig.name,
      basePriceFormatted: formatCents(calculation.basePriceCents),
      overageBreakdown: calculation.overageCharges.map((charge) => ({
        metric: charge.metric,
        includedQuantity: charge.includedQuantity,
        usedQuantity: charge.usedQuantity,
        overageQuantity: charge.overageQuantity,
        overageCostFormatted: formatCents(charge.overageCostCents),
      })),
      totalOverageFormatted: formatCents(calculation.totalOverageCents),
      totalFormatted: formatCents(calculation.totalCents),
      platformFeeFormatted: formatCents(calculation.platformFeeCents),
      netFormatted: formatCents(calculation.netAmountCents),
    };
  }

  /**
   * Calculate simple usage cost without plan limits
   */
  static calculateUsageCost(
    metric: string,
    quantity: number,
    pricePerUnitCents: number
  ): number {
    return Math.round(quantity * pricePerUnitCents);
  }
}
