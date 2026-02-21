import api, { getErrorMessage } from '@/lib/axios';
import type {
  BillingInfo,
  GetBillingInfoResponse,
  GetInvoicesParams,
  GetInvoicesResponse,
  GetStripeConnectResponse,
  Invoice,
  StartOnboardingResponse,
  StripeConnectStatus,
  UpgradePlanInput,
} from '@/types/billing';

export { getErrorMessage };

/**
 * Get billing overview information
 */
export async function getBillingInfo(): Promise<BillingInfo> {
  const response = await api.get<GetBillingInfoResponse>('/billing/info');
  return response.data.billing;
}

/**
 * Upgrade subscription plan
 */
export async function upgradePlan(data: UpgradePlanInput): Promise<void> {
  await api.post('/billing/upgrade', data);
}

/**
 * Cancel current subscription
 */
export async function cancelSubscription(): Promise<void> {
  await api.post('/billing/cancel');
}

/**
 * Get invoice history with optional filters
 */
export async function getInvoices(params: GetInvoicesParams = {}): Promise<GetInvoicesResponse> {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  if (params.status && params.status !== 'all') searchParams.append('status', params.status);

  const queryString = searchParams.toString();
  const url = `/billing/invoices${queryString ? `?${queryString}` : ''}`;

  const response = await api.get<GetInvoicesResponse>(url);
  return response.data;
}

/**
 * Retry a failed invoice payment
 */
export async function retryInvoicePayment(invoiceId: string): Promise<Invoice> {
  const response = await api.post<{ invoice: Invoice }>(`/billing/invoices/${invoiceId}/retry`);
  return response.data.invoice;
}

/**
 * Get Stripe Connect account status
 */
export async function getStripeConnectStatus(): Promise<StripeConnectStatus> {
  const response = await api.get<GetStripeConnectResponse>('/billing/connect');
  return response.data.connect;
}

/**
 * Start Stripe Connect onboarding flow
 */
export async function startStripeOnboarding(): Promise<string> {
  const response = await api.post<StartOnboardingResponse>('/billing/connect/onboard');
  return response.data.onboardingUrl;
}
