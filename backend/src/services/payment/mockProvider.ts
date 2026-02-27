import {
  IPaymentProvider,
  ChargeParams,
  TransferParams,
  ChargeResult,
  TransferResult,
  BalanceResult,
  ChargeError,
  ConnectAccountResult,
  ConnectAccountLinkResult,
  ConnectAccountStatusResult,
} from '../../types/payment.js';
import logger from '../../utils/logger.js';

export class MockPaymentProvider implements IPaymentProvider {
  private charges: Map<string, ChargeResult> = new Map();
  private transfers: Map<string, TransferResult> = new Map();
  private shouldFail: boolean = false;
  private failureReason?: string;

  setFailure(shouldFail: boolean, reason?: string): void {
    this.shouldFail = shouldFail;
    this.failureReason = reason;
  }

  reset(): void {
    this.charges.clear();
    this.transfers.clear();
    this.shouldFail = false;
    this.failureReason = undefined;
  }

  async createCharge(params: ChargeParams): Promise<ChargeResult> {
    logger.info({
      message: '[Mock] Creating charge',
      amountCents: params.amountCents,
      customerId: params.customerId,
    });

    if (this.shouldFail) {
      return {
        success: false,
        amountCents: params.amountCents,
        currency: params.currency || 'usd',
        status: 'failed',
        created: new Date(),
        error: {
          code: 'card_declined',
          message: this.failureReason || 'Mock card declined',
        },
      };
    }

    const chargeId = `mock_charge_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const result: ChargeResult = {
      success: true,
      chargeId,
      customerId: params.customerId,
      amountCents: params.amountCents,
      currency: params.currency || 'usd',
      status: 'succeeded',
      created: new Date(),
    };

    this.charges.set(chargeId, result);

    logger.info({
      message: '[Mock] Charge created',
      chargeId,
      amountCents: params.amountCents,
    });

    return result;
  }

  async createTransfer(params: TransferParams): Promise<TransferResult> {
    logger.info({
      message: '[Mock] Creating transfer',
      amountCents: params.amountCents,
      destinationAccountId: params.destinationAccountId,
    });

    if (this.shouldFail) {
      return {
        success: false,
        amountCents: params.amountCents,
        currency: params.currency || 'usd',
        destinationAccountId: params.destinationAccountId,
        status: 'failed',
        created: new Date(),
        error: {
          code: 'transfer_failed',
          message: this.failureReason || 'Mock transfer failed',
        },
      };
    }

    const transferId = `mock_transfer_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const result: TransferResult = {
      success: true,
      transferId,
      amountCents: params.amountCents,
      currency: params.currency || 'usd',
      destinationAccountId: params.destinationAccountId,
      status: 'paid',
      created: new Date(),
    };

    this.transfers.set(transferId, result);

    logger.info({
      message: '[Mock] Transfer created',
      transferId,
      amountCents: params.amountCents,
    });

    return result;
  }

  async getBalance(): Promise<BalanceResult> {
    logger.info({
      message: '[Mock] Getting balance',
    });

    return {
      available: 1000000, // $10,000
      pending: 50000, // $500
      currency: 'usd',
    };
  }

  async retrieveCharge(chargeId: string): Promise<ChargeResult> {
    logger.info({
      message: '[Mock] Retrieving charge',
      chargeId,
    });

    const charge = this.charges.get(chargeId);
    if (!charge) {
      return {
        success: false,
        amountCents: 0,
        currency: 'usd',
        status: 'failed',
        created: new Date(),
        error: {
          code: 'not_found',
          message: 'Charge not found',
        },
      };
    }

    return charge;
  }

  async refundCharge(
    chargeId: string,
    amountCents?: number
  ): Promise<{ success: boolean; refundId?: string; error?: ChargeError }> {
    logger.info({
      message: '[Mock] Refunding charge',
      chargeId,
      amountCents,
    });

    const charge = this.charges.get(chargeId);
    if (!charge) {
      return {
        success: false,
        error: {
          code: 'not_found',
          message: 'Charge not found',
        },
      };
    }

    const refundId = `mock_refund_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    logger.info({
      message: '[Mock] Refund created',
      refundId,
      chargeId,
    });

    return {
      success: true,
      refundId,
    };
  }

  // Stripe Connect methods (mock)

  async createConnectAccount(tenantId: string, email: string): Promise<ConnectAccountResult> {
    const accountId = `mock_acct_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    logger.info({ message: '[Mock] Connect account created', accountId, tenantId, email });
    return { success: true, accountId };
  }

  async createAccountLink(stripeAccountId: string, returnUrl: string, _refreshUrl: string): Promise<ConnectAccountLinkResult> {
    const url = `${returnUrl}?mock_onboarding=complete&account=${stripeAccountId}`;
    logger.info({ message: '[Mock] Account link created', stripeAccountId });
    return { success: true, url };
  }

  async getConnectAccountStatus(stripeAccountId: string): Promise<ConnectAccountStatusResult> {
    logger.info({ message: '[Mock] Getting Connect account status', stripeAccountId });
    return {
      accountId: stripeAccountId,
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      requirements: [],
    };
  }

  async createConnectLoginLink(stripeAccountId: string): Promise<{ url: string }> {
    logger.info({ message: '[Mock] Connect login link created', stripeAccountId });
    return { url: `https://dashboard.stripe.com/mock/${stripeAccountId}` };
  }
}
