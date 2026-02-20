/**
 * Billing Types
 *
 * Type definitions for the billing system.
 */

/**
 * Subscription plan
 */
export interface Plan {
  id: string;
  name: string;
  priceCents: number;
  features: string[];
  limits: {
    apiCallsPerMonth: number;
    storageBytes: number;
    activeUsers: number;
  };
}

/**
 * Usage metric for a single resource
 */
export interface UsageMetric {
  used: number;
  limit: number;
  percentage: number;
}

/**
 * Usage metrics for all resources
 */
export interface UsageMetrics {
  apiCalls: UsageMetric;
  storageBytes: UsageMetric;
  activeUsers: UsageMetric;
}

/**
 * Invoice status
 */
export type InvoiceStatus = 'paid' | 'failed' | 'pending' | 'open';

/**
 * Invoice record
 */
export interface Invoice {
  id: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl: string | null;
  [key: string]: unknown;
}

/**
 * Stripe Connect status
 */
export interface StripeConnectStatus {
  connected: boolean;
  onboardingComplete: boolean;
  accountId: string | null;
  onboardingUrl: string | null;
}

/**
 * Billing overview info
 */
export interface BillingInfo {
  currentPlan: Plan;
  usage: UsageMetrics;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextRenewalDate: string | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Upgrade plan input
 */
export interface UpgradePlanInput {
  planId: string;
  paymentMethodId: string;
}

/**
 * API response types
 */
export interface GetBillingInfoResponse {
  billing: BillingInfo;
}

export interface GetInvoicesParams {
  page?: number;
  limit?: number;
  status?: InvoiceStatus | 'all';
}

export interface GetInvoicesResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
}

export interface GetStripeConnectResponse {
  connect: StripeConnectStatus;
}

export interface StartOnboardingResponse {
  onboardingUrl: string;
}
