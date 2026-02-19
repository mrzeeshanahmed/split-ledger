export interface UsageRecord {
  id: string;
  metric: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  metadata: Record<string, unknown>;
  recordedAt: Date;
}

export interface UsageMetric {
  name: string;
  displayName: string;
  unit: string;
  includedQuantity: number;
  overagePriceCents: number;
}

export interface BillingPeriod {
  startDate: Date;
  endDate: Date;
  periodString: string; // YYYY-MM format
}

export interface RevenueRecord {
  id: string;
  tenantId: string;
  billingPeriod: string;
  chargeType: 'subscription' | 'usage' | 'overage' | 'adjustment';
  grossAmountCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripeChargeId?: string;
  stripeTransferId?: string;
  stripeCustomerId?: string;
  description?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
}

export interface BillingResult {
  success: boolean;
  tenantId: string;
  billingPeriod: string;
  charges: {
    type: 'subscription' | 'usage' | 'overage';
    amountCents: number;
  }[];
  grossTotalCents: number;
  platformFeeCents: number;
  netTotalCents: number;
  stripeChargeId?: string;
  stripeTransferId?: string;
  errors?: string[];
}

export interface BillingJobResult {
  billingPeriod: string;
  startedAt: Date;
  completedAt: Date;
  totalTenants: number;
  successfullyBilled: number;
  failedCount: number;
  totalRevenueCents: number;
  totalPlatformFeeCents: number;
  results: BillingResult[];
}

export interface ReconciliationReport {
  billingPeriod: string;
  generatedAt: Date;
  revenueRecords: {
    totalCharges: number;
    completedCharges: number;
    pendingCharges: number;
    failedCharges: number;
    totalAmountCents: number;
    completedAmountCents: number;
    pendingAmountCents: number;
  };
  stripeData?: {
    totalCharges: number;
    totalAmountCents: number;
  };
  discrepancies: {
    count: number;
    details: Array<{
      tenantId: string;
      type: 'missing_in_stripe' | 'missing_in_db' | 'amount_mismatch';
      expectedAmountCents: number;
      actualAmountCents: number;
    }>;
  };
}

export interface UsageAggregation {
  metric: string;
  totalQuantity: number;
  totalCostCents: number;
  period: BillingPeriod;
}

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly code: BillingErrorCode,
    public readonly statusCode: number = 500,
    public readonly tenantId?: string
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

export type BillingErrorCode =
  | 'USAGE_RECORD_FAILED'
  | 'BILLING_CALCULATION_FAILED'
  | 'PAYMENT_FAILED'
  | 'TRANSFER_FAILED'
  | 'IDEMPOTENCY_KEY_EXISTS'
  | 'TENANT_NOT_FOUND'
  | 'INVALID_BILLING_PERIOD'
  | 'RECONCILIATION_FAILED'
  | 'STRIPE_ERROR';

export interface PlanConfig {
  name: string;
  stripePriceId?: string;
  basePriceCents: number;
  includedApiCalls: number;
  includedStorageMb: number;
  overageApiCallsCents: number;
  overageStorageMbCents: number;
  features: string[];
}

export const USAGE_METRICS: Record<string, UsageMetric> = {
  api_calls: {
    name: 'api_calls',
    displayName: 'API Calls',
    unit: 'request',
    includedQuantity: 0,
    overagePriceCents: 0.1, // $0.001 per API call
  },
  storage_mb: {
    name: 'storage_mb',
    displayName: 'Storage',
    unit: 'MB',
    includedQuantity: 100,
    overagePriceCents: 10, // $0.10 per MB
  },
  transactions: {
    name: 'transactions',
    displayName: 'Transactions',
    unit: 'transaction',
    includedQuantity: 0,
    overagePriceCents: 1, // $0.01 per transaction
  },
};
