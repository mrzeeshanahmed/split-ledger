import { z } from 'zod';
import { env } from '../config/env.js';
import { SubscriptionPlan } from '../types/tenant.js';

const planConfigSchema = z.object({
  name: z.string(),
  stripePriceId: z.string().optional(),
  basePriceCents: z.number(),
  includedApiCalls: z.number(),
  includedStorageMb: z.number(),
  overageApiCallsCents: z.number(),
  overageStorageMbCents: z.number(),
  features: z.array(z.string()),
});

export type PlanConfig = z.infer<typeof planConfigSchema>;

export const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  free: {
    name: 'Free',
    basePriceCents: 0,
    includedApiCalls: 100,
    includedStorageMb: 10,
    overageApiCallsCents: 0.1, // $0.001 per API call
    overageStorageMbCents: 10, // $0.10 per MB
    features: ['Basic API access', 'Community support'],
  },
  basic: {
    name: 'Basic',
    stripePriceId: env.STRIPE_PRICE_STARTER,
    basePriceCents: 1900, // $19/month
    includedApiCalls: 10000,
    includedStorageMb: 100,
    overageApiCallsCents: 0.05, // $0.0005 per API call
    overageStorageMbCents: 5, // $0.05 per MB
    features: ['Priority API access', 'Email support', 'Basic analytics'],
  },
  pro: {
    name: 'Pro',
    stripePriceId: env.STRIPE_PRICE_PRO,
    basePriceCents: 4900, // $49/month
    includedApiCalls: 100000,
    includedStorageMb: 1000,
    overageApiCallsCents: 0.03, // $0.0003 per API call
    overageStorageMbCents: 3, // $0.03 per MB
    features: ['High priority API access', 'Priority support', 'Advanced analytics', 'Custom integrations'],
  },
  enterprise: {
    name: 'Enterprise',
    basePriceCents: 0, // Custom pricing
    includedApiCalls: Number.MAX_SAFE_INTEGER,
    includedStorageMb: Number.MAX_SAFE_INTEGER,
    overageApiCallsCents: 0,
    overageStorageMbCents: 0,
    features: [
      'Unlimited API access',
      'Unlimited storage',
      'Dedicated support',
      'Custom SLAs',
      'On-premise deployment',
      'Advanced security',
    ],
  },
};

export function getPlan(plan: SubscriptionPlan): PlanConfig {
  return PLANS[plan];
}

export function isOverageEnabled(plan: SubscriptionPlan): boolean {
  return plan === 'free' || plan === 'basic' || plan === 'pro';
}

export function getIncludedApiCalls(plan: SubscriptionPlan): number {
  return PLANS[plan].includedApiCalls;
}

export function getIncludedStorageMb(plan: SubscriptionPlan): number {
  return PLANS[plan].includedStorageMb;
}

export function getBasePrice(plan: SubscriptionPlan): number {
  return PLANS[plan].basePriceCents;
}

export function getOveragePriceApiCalls(plan: SubscriptionPlan): number {
  return PLANS[plan].overageApiCallsCents;
}

export function getOveragePriceStorageMb(plan: SubscriptionPlan): number {
  return PLANS[plan].overageStorageMbCents;
}
