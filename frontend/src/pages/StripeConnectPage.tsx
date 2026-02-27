import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AppShell,
  TopBar,
  SidebarNav,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  GhostButton,
  PrimaryButton,
  SkeletonCard,
  EmptyState,
  useToast,
} from '@/components';
import { getStripeConnectStatus, startStripeOnboarding, getErrorMessage } from '@/api/billing';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { BadgeVariant } from '@/components/ui/Badge';

/**
 * StripeConnectPage - Stripe Connect account status and onboarding
 */
export function StripeConnectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const {
    data: connectStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['stripe-connect'],
    queryFn: getStripeConnectStatus,
  });

  const onboardMutation = useMutation({
    mutationFn: startStripeOnboarding,
    onSuccess: (onboardingUrl) => {
      window.location.href = onboardingUrl;
    },
    onError: (error) => {
      addToast({ message: getErrorMessage(error), variant: 'error', duration: 5000 });
    },
  });

  useEffect(() => {
    const returnStatus = searchParams.get('connect');
    if (returnStatus === 'success') {
      queryClient.invalidateQueries({ queryKey: ['stripe-connect'] });
      addToast({
        message: 'Stripe Connect account connected successfully',
        variant: 'success',
        duration: 4000,
      });
    } else if (returnStatus === 'refresh') {
      addToast({
        message: 'Onboarding session expired. Please try again.',
        variant: 'warning',
        duration: 4000,
      });
    }
  }, [searchParams, queryClient, addToast]);

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
      left={<img src="/src/assets/logo.png" alt="Split-Ledger Logo" className="h-8 object-contain" />}
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

  const getConnectionBadge = (): { variant: BadgeVariant; label: string } => {
    if (!connectStatus?.connected) return { variant: 'default', label: 'Not Connected' };
    if (!connectStatus.onboardingComplete) return { variant: 'warning', label: 'In Progress' };
    return { variant: 'success', label: 'Active' };
  };

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      <div className="flex items-center gap-4 mb-6">
        <GhostButton size="sm" onClick={() => navigate('/dashboard/billing')} leftIcon={<BackIcon />}>
          Back to Billing
        </GhostButton>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Stripe Connect</h1>
        <p className="text-text-secondary mt-1">Connect your Stripe account to receive payments</p>
      </div>

      {isLoading ? (
        <SkeletonCard />
      ) : error ? (
        <EmptyState
          title="Failed to load Stripe Connect status"
          description="There was an error loading your Stripe Connect status. Please try again."
          action={{
            label: 'Retry',
            onClick: () => queryClient.invalidateQueries({ queryKey: ['stripe-connect'] }),
          }}
        />
      ) : connectStatus ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Account Status</CardTitle>
                  <CardDescription>Your Stripe Connect account connection status</CardDescription>
                </div>
                <Badge variant={getConnectionBadge().variant} size="lg">
                  {getConnectionBadge().label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {connectStatus.connected && connectStatus.accountId && (
                <div className="mb-4">
                  <p className="text-sm text-text-secondary">Account ID</p>
                  <p className="text-sm font-mono text-text-primary mt-0.5">{connectStatus.accountId}</p>
                </div>
              )}

              {!connectStatus.connected && (
                <div className="py-4">
                  <p className="text-sm text-text-secondary mb-6">
                    Connect your Stripe account to enable payment processing, accept payments from customers,
                    and manage payouts directly to your bank account.
                  </p>
                  <ul className="space-y-2 mb-6">
                    {[
                      'Accept credit card payments',
                      'Automated payouts to your bank account',
                      'Real-time transaction monitoring',
                      'Dispute and refund management',
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                        <CheckIcon />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <PrimaryButton
                    onClick={() => onboardMutation.mutate()}
                    loading={onboardMutation.isPending}
                    leftIcon={<ConnectIcon />}
                  >
                    Connect Stripe Account
                  </PrimaryButton>
                </div>
              )}

              {connectStatus.connected && !connectStatus.onboardingComplete && (
                <div className="py-4">
                  <div className="flex items-start gap-3 rounded-lg px-4 py-3 bg-warning-50 text-warning-700 mb-6">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">
                      Your Stripe onboarding is incomplete. Please complete the onboarding process to start accepting payments.
                    </p>
                  </div>
                  <PrimaryButton
                    onClick={() => onboardMutation.mutate()}
                    loading={onboardMutation.isPending}
                  >
                    Continue Onboarding
                  </PrimaryButton>
                </div>
              )}

              {connectStatus.connected && connectStatus.onboardingComplete && (
                <div className="py-4">
                  <div className="flex items-start gap-3 rounded-lg px-4 py-3 bg-accent-50 text-accent-700 mb-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">
                      Your Stripe account is fully connected and ready to accept payments.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About Stripe Connect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary">
                Stripe Connect allows Split-Ledger to process payments on your behalf. Your financial data is
                secure and protected by Stripe&apos;s industry-leading security infrastructure. We never store
                your banking information directly.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
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

function ConnectIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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

export default StripeConnectPage;
