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

export async function initializePaymentProvider(type?: PaymentProviderType): Promise<void> {
  const resolvedType = type ?? (env.STRIPE_SECRET_KEY !== 'NOT_SET' ? 'stripe' : 'mock');

  if (resolvedType === 'stripe') {
    const { StripePaymentProvider } = await import('./stripeProvider.js');
    paymentProvider = new StripePaymentProvider(env.STRIPE_SECRET_KEY);
    logger.info({ message: 'Initialized Stripe payment provider' });
  } else {
    const { MockPaymentProvider } = await import('./mockProvider.js');
    paymentProvider = new MockPaymentProvider();
    logger.info({ message: 'Initialized Mock payment provider' });
  }
}

export function setPaymentProvider(provider: IPaymentProvider): void {
  paymentProvider = provider;
}

export type { IPaymentProvider, PaymentProviderType };
