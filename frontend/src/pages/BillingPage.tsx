import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  TopBar,
  SidebarNav,
  StatCard,
  GhostButton,
  PrimaryButton,
  DangerButton,
  ProgressBar,
  ConfirmationModal,
  SkeletonCard,
  EmptyState,
  useToast,
} from '@/components';
import { UsageWarningBanner } from '@/components/billing/UsageWarningBanner';
import { getBillingInfo, cancelSubscription, getErrorMessage } from '@/api/billing';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { UsageMetric } from '@/types/billing';

/**
 * BillingPage - Billing overview for the current subscription
 */
export function BillingPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());

  const {
    data: billing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['billing'],
    queryFn: getBillingInfo,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      setIsCancelModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['billing'] });
      addToast({
        message: 'Subscription cancelled. It will remain active until the end of the billing period.',
        variant: 'success',
        duration: 5000,
      });
    },
    onError: (error) => {
      addToast({
        message: getErrorMessage(error),
        variant: 'error',
        duration: 5000,
      });
    },
  });

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

  const dismissBanner = (key: string) => {
    setDismissedBanners((prev) => new Set([...prev, key]));
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

  const usageMetrics: Array<{ key: string; label: string; metric: UsageMetric | undefined; unit?: string }> = billing
    ? [
      { key: 'apiCalls', label: 'API Calls', metric: billing.usage.apiCalls },
      { key: 'storageBytes', label: 'Storage', metric: billing.usage.storageBytes, unit: 'bytes' },
      { key: 'activeUsers', label: 'Active Users', metric: billing.usage.activeUsers },
    ]
    : [];

  const getProgressVariant = (percentage: number): 'primary' | 'warning' | 'error' => {
    if (percentage >= 95) return 'error';
    if (percentage >= 80) return 'warning';
    return 'primary';
  };

  const formatMetricValue = (value: number, unit?: string): string => {
    if (unit === 'bytes') {
      const mb = value / (1024 * 1024);
      if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
      return `${mb.toFixed(1)} MB`;
    }
    return value.toLocaleString();
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Billing</h1>
          <p className="text-text-secondary mt-1">Manage your subscription and billing information</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      ) : error ? (
        <EmptyState
          title="Failed to load billing information"
          description="There was an error loading your billing data. Please try again."
          action={{
            label: 'Retry',
            onClick: () => queryClient.invalidateQueries({ queryKey: ['billing'] }),
          }}
        />
      ) : billing ? (
        <>
          {/* Plan Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              label="Current Plan"
              value={billing.currentPlan.name}
              icon={<BillingIcon />}
            />
            <StatCard
              label="Status"
              value={billing.subscriptionStatus.charAt(0).toUpperCase() + billing.subscriptionStatus.slice(1).replace('_', ' ')}
              icon={<StatusIcon />}
            />
            <StatCard
              label="Next Renewal"
              value={formatDate(billing.nextRenewalDate)}
              icon={<CalendarIcon />}
            />
          </div>

          {/* Usage Section */}
          <div className="bg-white border border-border-default rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary mb-1">Usage This Period</h2>
            <p className="text-sm text-text-secondary mb-6">
              {formatDate(billing.currentPeriodStart)} &mdash; {formatDate(billing.currentPeriodEnd)}
            </p>
            <div className="space-y-6">
              {usageMetrics.map(({ key, label, metric, unit }) => {
                if (!metric) return null;
                const showBanner = metric.percentage >= 80 && !dismissedBanners.has(key);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">{label}</span>
                      <span className="text-sm text-text-secondary">
                        {formatMetricValue(metric.used, unit)} / {formatMetricValue(metric.limit, unit)}
                        <span className="ml-2 font-medium">({Math.round(metric.percentage)}%)</span>
                      </span>
                    </div>
                    <ProgressBar
                      value={metric.percentage}
                      variant={getProgressVariant(metric.percentage)}
                      size="md"
                    />
                    {showBanner && (
                      <div className="mt-3">
                        <UsageWarningBanner
                          percentage={metric.percentage}
                          metricName={label}
                          onDismiss={() => dismissBanner(key)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan Features */}
          <div className="bg-white border border-border-default rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Plan Features</h2>
            <ul className="space-y-2">
              {billing.currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="bg-white border border-border-default rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Billing Actions</h2>
            <div className="flex flex-wrap gap-3">
              <GhostButton onClick={() => navigate('/dashboard/billing/invoices')}>
                View Invoice History
              </GhostButton>
              <GhostButton onClick={() => navigate('/dashboard/billing/connect')}>
                Stripe Connect
              </GhostButton>
            </div>
          </div>

          {/* Subscription Status Banner */}
          {billing.cancelAtPeriodEnd && (
            <div className="flex items-start gap-3 rounded-lg px-4 py-3 bg-warning-50 text-warning-700 mb-8">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm font-medium">
                Your subscription is scheduled to cancel on {formatDate(billing.nextRenewalDate)}.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <PrimaryButton onClick={() => navigate('/dashboard/billing/upgrade')}>
              Upgrade Plan
            </PrimaryButton>
            {!billing.cancelAtPeriodEnd && billing.subscriptionStatus === 'active' && (
              <DangerButton onClick={() => setIsCancelModalOpen(true)}>
                Cancel Subscription
              </DangerButton>
            )}
          </div>

          {/* Cancel Confirmation Modal */}
          <ConfirmationModal
            isOpen={isCancelModalOpen}
            onClose={() => setIsCancelModalOpen(false)}
            onConfirm={() => cancelMutation.mutate()}
            title="Cancel Subscription"
            description="Are you sure you want to cancel your subscription? You will retain access until the end of the current billing period."
            confirmText="Cancel Subscription"
            cancelText="Keep Subscription"
            confirmVariant="danger"
            loading={cancelMutation.isPending}
          />
        </>
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

export function BillingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function WebhooksIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export default BillingPage;
