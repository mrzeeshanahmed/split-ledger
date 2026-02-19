import Stripe from 'stripe';
import {
  IPaymentProvider,
  ChargeParams,
  TransferParams,
  ChargeResult,
  TransferResult,
  BalanceResult,
  ChargeError,
} from '../../types/payment.js';
import logger from '../../utils/logger.js';

export class StripePaymentProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor(stripeSecretKey: string) {
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createCharge(params: ChargeParams): Promise<ChargeResult> {
    try {
      const charge = await this.stripe.charges.create(
        {
          amount: params.amountCents,
          currency: params.currency || 'usd',
          customer: params.customerId,
          description: params.description,
          metadata: params.metadata,
          capture: true,
        },
        {
          idempotencyKey: params.idempotencyKey,
        }
      );

      logger.info({
        message: 'Stripe charge created',
        chargeId: charge.id,
        amountCents: params.amountCents,
        customerId: params.customerId,
      });

      return {
        success: charge.status === 'succeeded',
        chargeId: charge.id,
        customerId: charge.customer as string,
        amountCents: charge.amount,
        currency: charge.currency,
        status: charge.status as 'succeeded' | 'pending' | 'failed',
        created: new Date(charge.created * 1000),
      };
    } catch (error) {
      const stripeError = this.mapStripeError(error);
      logger.error({
        message: 'Stripe charge failed',
        error: stripeError.message,
        code: stripeError.code,
        customerId: params.customerId,
      });
      return {
        success: false,
        amountCents: params.amountCents,
        currency: params.currency || 'usd',
        status: 'failed',
        created: new Date(),
        error: stripeError,
      };
    }
  }

  async createTransfer(params: TransferParams): Promise<TransferResult> {
    try {
      const transfer = await this.stripe.transfers.create(
        {
          amount: params.amountCents,
          currency: params.currency || 'usd',
          destination: params.destinationAccountId,
          description: params.description,
          metadata: params.metadata,
        },
        {
          idempotencyKey: params.idempotencyKey,
        }
      );

      logger.info({
        message: 'Stripe transfer created',
        transferId: transfer.id,
        amountCents: params.amountCents,
        destinationAccountId: params.destinationAccountId,
      });

      return {
        success: transfer.status === 'paid' || transfer.status === 'pending',
        transferId: transfer.id,
        amountCents: transfer.amount,
        currency: transfer.currency,
        destinationAccountId: transfer.destination as string,
        status: transfer.status as 'pending' | 'paid' | 'failed' | 'canceled',
        created: new Date(transfer.created * 1000),
      };
    } catch (error) {
      const stripeError = this.mapTransferError(error);
      logger.error({
        message: 'Stripe transfer failed',
        error: stripeError.message,
        code: stripeError.code,
        destinationAccountId: params.destinationAccountId,
      });
      return {
        success: false,
        amountCents: params.amountCents,
        currency: params.currency || 'usd',
        destinationAccountId: params.destinationAccountId,
        status: 'failed',
        created: new Date(),
        error: stripeError,
      };
    }
  }

  async getBalance(): Promise<BalanceResult> {
    try {
      const balance = await this.stripe.balance.retrieve();

      const available = balance.available.reduce((sum, b) => sum + b.amount, 0);
      const pending = balance.pending.reduce((sum, b) => sum + b.amount, 0);

      return {
        available,
        pending,
        currency: balance.available[0]?.currency || 'usd',
      };
    } catch (error) {
      logger.error({
        message: 'Failed to retrieve Stripe balance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async retrieveCharge(chargeId: string): Promise<ChargeResult> {
    try {
      const charge = await this.stripe.charges.retrieve(chargeId);

      return {
        success: charge.status === 'succeeded',
        chargeId: charge.id,
        customerId: charge.customer as string,
        amountCents: charge.amount,
        currency: charge.currency,
        status: charge.status as 'succeeded' | 'pending' | 'failed',
        created: new Date(charge.created * 1000),
      };
    } catch (error) {
      const stripeError = this.mapStripeError(error);
      logger.error({
        message: 'Failed to retrieve Stripe charge',
        error: stripeError.message,
        chargeId,
      });
      return {
        success: false,
        amountCents: 0,
        currency: 'usd',
        status: 'failed',
        created: new Date(),
        error: stripeError,
      };
    }
  }

  async refundCharge(
    chargeId: string,
    amountCents?: number
  ): Promise<{ success: boolean; refundId?: string; error?: ChargeError }> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        charge: chargeId,
      };

      if (amountCents) {
        refundParams.amount = amountCents;
      }

      const refund = await this.stripe.refunds.create(refundParams);

      logger.info({
        message: 'Stripe refund created',
        refundId: refund.id,
        chargeId,
        amountCents: amountCents || 'full',
      });

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
      };
    } catch (error) {
      const stripeError = this.mapStripeError(error);
      logger.error({
        message: 'Stripe refund failed',
        error: stripeError.message,
        chargeId,
      });
      return {
        success: false,
        error: stripeError,
      };
    }
  }

  private mapStripeError(error: unknown): ChargeError {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        code: error.code || 'stripe_error',
        message: error.message,
        declineCode: error.type === 'StripeCardError' ? (error as Stripe.CardError).decline_code : undefined,
      };
    }
    return {
      code: 'unknown_error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }

  private mapTransferError(error: unknown): { code: string; message: string } {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        code: error.code || 'stripe_error',
        message: error.message,
      };
    }
    return {
      code: 'unknown_error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
