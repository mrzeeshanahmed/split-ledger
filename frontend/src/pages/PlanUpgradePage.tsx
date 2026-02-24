import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  AppShell,
  TopBar,
  SidebarNav,
  Card,
  CardContent,
  GhostButton,
  PrimaryButton,
  useToast,
} from '@/components';
import { upgradePlan, getErrorMessage } from '@/api/billing';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { Plan } from '@/types/billing';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceCents: 0,
    features: ['1,000 API calls/month', '1 GB storage', '5 active users'],
    limits: { apiCallsPerMonth: 1000, storageBytes: 1073741824, activeUsers: 5 },
  },
  {
    id: 'starter',
    name: 'Starter',
    priceCents: 2900,
    features: ['50,000 API calls/month', '10 GB storage', '25 active users', 'Priority support'],
    limits: { apiCallsPerMonth: 50000, storageBytes: 10737418240, activeUsers: 25 },
  },
  {
    id: 'pro',
    name: 'Pro',
    priceCents: 9900,
    features: ['500,000 API calls/month', '100 GB storage', 'Unlimited users', 'Priority support', 'Custom integrations'],
    limits: { apiCallsPerMonth: 500000, storageBytes: 107374182400, activeUsers: -1 },
  },
];

/**
 * PlanUpgradePage - Select a plan and upgrade using Stripe Elements
 */
export function PlanUpgradePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      logoutStore();
      addToast({ message: 'Successfully logged out', variant: 'success', duration: 3000 });
      navigate('/login', { replace: true });
    } catch (error) {
      addToast({ message: getErrorMessage(error), variant: 'error', duration: 5000 });
    }
  };

  const sidebarItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
    { label: 'Expenses', icon: <ExpensesIcon />, href: '/expenses' },
    { label: 'Groups', icon: <GroupsIcon />, href: '/groups' },
    { label: 'Settlements', icon: <SettlementsIcon />, href: '/settlements' },
    { label: 'API Keys', icon: <KeyIcon />, href: '/dashboard/api-keys' },
    { label: 'Webhooks', icon: <WebhooksIcon />, href: '/dashboard/webhooks' },
    { label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
    { label: 'Billing', icon: <BillingIcon />, href: '/dashboard/billing', active: true },
  ];

  const sidebar = (
    <SidebarNav
      items={sidebarItems}
      collapsed={sidebarCollapsed}
      onCollapsedChange={setSidebarCollapsed}
    />
  );

  const topBar = (
    <TopBar
      left={<span className="text-lg font-semibold text-text-primary">Split-Ledger</span>}
      right={
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {user?.firstName} {user?.lastName}
          </span>
          <GhostButton size="sm" onClick={handleLogout}>
            Logout
          </GhostButton>
        </div>
      }
    />
  );

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      <div className="flex items-center gap-4 mb-6">
        <GhostButton size="sm" onClick={() => navigate('/dashboard/billing')} leftIcon={<BackIcon />}>
          Back to Billing
        </GhostButton>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Upgrade Plan</h1>
        <p className="text-text-secondary mt-1">Choose a plan that fits your needs</p>
      </div>

      <Elements stripe={stripePromise}>
        <UpgradeForm plans={PLANS} onSuccess={() => navigate('/dashboard/billing')} />
      </Elements>
    </AppShell>
  );
}

interface UpgradeFormProps {
  plans: Plan[];
  onSuccess: () => void;
}

function UpgradeForm({ plans, onSuccess }: UpgradeFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { addToast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('starter');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const upgradeMutation = useMutation({
    mutationFn: upgradePlan,
    onSuccess: () => {
      addToast({ message: 'Plan upgraded successfully', variant: 'success', duration: 3000 });
      onSuccess();
    },
    onError: (error) => {
      addToast({ message: getErrorMessage(error), variant: 'error', duration: 5000 });
    },
  });

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !selectedPlan) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsSubmitting(true);
    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        addToast({ message: error.message || 'Card error', variant: 'error', duration: 5000 });
        return;
      }

      await upgradeMutation.mutateAsync({
        planId: selectedPlan.id,
        paymentMethodId: paymentMethod.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (priceCents: number): string => {
    if (priceCents === 0) return 'Free';
    return `$${(priceCents / 100).toFixed(2)}/mo`;
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Plan Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlanId(plan.id)}
            className={`text-left rounded-lg border-2 p-5 transition-all duration-normal focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${selectedPlanId === plan.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-border-default bg-white hover:border-border-strong'
              }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-text-primary">{plan.name}</h3>
              {selectedPlanId === plan.id && <SelectedCheckIcon />}
            </div>
            <p className="text-2xl font-bold text-text-primary mb-4">{formatPrice(plan.priceCents)}</p>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {/* Card Element - only shown for paid plans */}
      {selectedPlan && selectedPlan.priceCents > 0 && (
        <Card className="mb-8">
          <CardContent>
            <h2 className="text-base font-semibold text-text-primary mb-4">Payment Details</h2>
            <div className="border border-border-default rounded-lg p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '14px',
                      color: '#0f172a',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      '::placeholder': { color: '#94a3b8' },
                    },
                    invalid: { color: '#dc2626' },
                  },
                }}
              />
            </div>
            <p className="text-xs text-text-muted mt-3 flex items-center gap-1">
              <LockIcon />
              Your payment information is encrypted and secure
            </p>
          </CardContent>
        </Card>
      )}

      <PrimaryButton
        type="submit"
        loading={isSubmitting || upgradeMutation.isPending}
        disabled={!selectedPlan || isSubmitting}
      >
        {selectedPlan?.priceCents === 0
          ? 'Switch to Free Plan'
          : `Upgrade to ${selectedPlan?.name} — ${formatPrice(selectedPlan?.priceCents ?? 0)}`}
      </PrimaryButton>
    </form>
  );
}

// Icon components
function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SettlementsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 18.464a2.992 2.992 0 01-.3 3.197 2.993 2.993 0 01-4.237.225 3 3 0 01-.225-4.237 2.992 2.992 0 013.197-.3l3.72-3.721a6 6 0 015.743-7.743z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-accent-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SelectedCheckIcon() {
  return (
    <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function WebhooksIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export default PlanUpgradePage;
