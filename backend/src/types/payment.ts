export interface ChargeParams {
  amountCents: number;
  currency?: string;
  customerId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
}

export interface TransferParams {
  amountCents: number;
  currency?: string;
  destinationAccountId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
}

export interface ChargeResult {
  success: boolean;
  chargeId?: string;
  customerId?: string;
  amountCents: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  created: Date;
  error?: ChargeError;
}

export interface TransferResult {
  success: boolean;
  transferId?: string;
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  created: Date;
  error?: TransferError;
}

export interface BalanceResult {
  available: number;
  pending: number;
  currency: string;
}

export interface ChargeError {
  code: string;
  message: string;
  declineCode?: string;
}

export interface TransferError {
  code: string;
  message: string;
}

export interface PaymentProviderConfig {
  stripeSecretKey: string;
  isTestMode?: boolean;
}

export type PaymentProviderType = 'stripe' | 'mock';

export interface IPaymentProvider {
  createCharge(params: ChargeParams): Promise<ChargeResult>;
  createTransfer(params: TransferParams): Promise<TransferResult>;
  getBalance(): Promise<BalanceResult>;
  retrieveCharge(chargeId: string): Promise<ChargeResult>;
  refundCharge(chargeId: string, amountCents?: number): Promise<{ success: boolean; refundId?: string; error?: ChargeError }>;

  // Stripe Connect methods
  createConnectAccount(tenantId: string, email: string): Promise<ConnectAccountResult>;
  createAccountLink(stripeAccountId: string, returnUrl: string, refreshUrl: string): Promise<ConnectAccountLinkResult>;
  getConnectAccountStatus(stripeAccountId: string): Promise<ConnectAccountStatusResult>;
  createConnectLoginLink(stripeAccountId: string): Promise<{ url: string }>;
}

export interface ConnectAccountResult {
  success: boolean;
  accountId?: string;
  error?: string;
}

export interface ConnectAccountLinkResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ConnectAccountStatusResult {
  accountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: string[];
}
