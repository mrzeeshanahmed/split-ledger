import { env } from '../../config/env.js';
import logger from '../../utils/logger.js';
import type {
  IPaymentProvider,
  PaymentProviderType,
} from '../../types/payment.js';

let paymentProvider: IPaymentProvider | null = null;

export function getPaymentProvider(): IPaymentProvider {
  if (!paymentProvider) {
    throw new Error('Payment provider not initialized. Call initializePaymentProvider() first.');
  }
  return paymentProvider;
}

export function initializePaymentProvider(type: PaymentProviderType = 'stripe'): void {
  if (type === 'stripe') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { StripePaymentProvider } = require('./stripeProvider.js');
    paymentProvider = new StripePaymentProvider(env.STRIPE_SECRET_KEY);
    logger.info({ message: 'Initialized Stripe payment provider' });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MockPaymentProvider } = require('./mockProvider.js');
    paymentProvider = new MockPaymentProvider();
    logger.info({ message: 'Initialized Mock payment provider' });
  }
}

export function setPaymentProvider(provider: IPaymentProvider): void {
  paymentProvider = provider;
}

export type { IPaymentProvider, PaymentProviderType };
