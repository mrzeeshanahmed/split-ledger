import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppShell,
  TopBar,
  SidebarNav,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  StatCard,
  GhostButton,
  DataTable,
  Badge,
  EmptyState,
  LoadingOverlay,
  useToast,
} from '@/components';
import { UsageChart } from '@/components/api-keys';
import { getApiKey, getApiKeyUsage, getErrorMessage } from '@/api/apiKeys';
import { useAuthStore } from '@/stores/authStore';
import type { TopEndpoint } from '@/types/apiKeys';

/**
 * ApiKeyUsagePage - Usage analytics dashboard for a specific API key
 */
export function ApiKeyUsagePage() {
  const { id: apiKeyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  // Fetch API key details
  const {
    data: apiKeyData,
    isLoading: isKeyLoading,
    error: keyError,
  } = useQuery({
    queryKey: ['api-key', apiKeyId],
    queryFn: () => getApiKey(apiKeyId!),
    enabled: !!apiKeyId,
  });

  // Fetch usage data
  const {
    data: usageData,
    isLoading: isUsageLoading,
    error: usageError,
  } = useQuery({
    queryKey: ['api-key-usage', apiKeyId],
    queryFn: () => getApiKeyUsage(apiKeyId!),
    enabled: !!apiKeyId,
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      const { logout } = await import('@/api/auth');
      await logout();
      logoutStore();
      addToast({
        message: 'Successfully logged out',
        variant: 'success',
        duration: 3000,
      });
      navigate('/login', { replace: true });
    } catch (error) {
      addToast({
        message: getErrorMessage(error),
        variant: 'error',
        duration: 5000,
      });
    }
  };

  // Sidebar items
  const sidebarItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard' },
    { label: 'Expenses', icon: <ExpensesIcon />, href: '/expenses' },
    { label: 'Groups', icon: <GroupsIcon />, href: '/groups' },
    { label: 'Settlements', icon: <SettlementsIcon />, href: '/settlements' },
    { label: 'API Keys', icon: <KeyIcon />, href: '/dashboard/api-keys', active: true },
    { label: 'Webhooks', icon: <WebhooksIcon />, href: '/dashboard/webhooks' },
    { label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
    { label: 'Billing', icon: <BillingIcon />, href: '/dashboard/billing' },
  ];

  // Top endpoints table columns
  const endpointColumns = [
    {
      key: 'endpoint' as const,
      header: 'Endpoint',
      render: (value: unknown) => (
        <span className="font-mono text-sm text-text-primary">{value as string}</span>
      ),
    },
    {
      key: 'method' as const,
      header: 'Method',
      render: (value: unknown) => {
        const method = value as string;
        return (
          <Badge
            variant={
              method === 'GET'
                ? 'success'
                : method === 'POST'
                  ? 'info'
                  : method === 'DELETE'
                    ? 'error'
                    : 'warning'
            }
            size="sm"
          >
            {method}
          </Badge>
        );
      },
    },
    {
      key: 'count' as const,
      header: 'Requests',
      align: 'right' as const,
      render: (value: unknown) => <span className="text-sm text-text-primary">{(value as number).toLocaleString()}</span>,
    },
  ];

  // Filter data by date range
  const filteredData = React.useMemo(() => {
    if (!usageData?.requestsByDay) return [];

    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return usageData.requestsByDay.filter((day) => new Date(day.date) >= cutoffDate);
  }, [usageData, dateRange]);

  // Calculate stats for the filtered period
  const filteredStats = React.useMemo(() => {
    if (!usageData) return null;

    const totalRequests = filteredData.reduce((sum, day) => sum + day.count, 0);
    const avgPerDay = filteredData.length > 0 ? totalRequests / filteredData.length : 0;

    return {
      totalRequests,
      avgPerDay,
      avgResponseTime: usageData.avgResponseTime,
      successRate: usageData.successRate,
    };
  }, [usageData, filteredData]);

  const isLoading = isKeyLoading || isUsageLoading;
  const error = keyError || usageError;

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

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GhostButton size="sm" onClick={() => navigate('/dashboard/api-keys')} leftIcon={<BackIcon />}>
          Back to API Keys
        </GhostButton>
      </div>

      {error ? (
        <EmptyState
          title="Failed to load usage data"
          description="There was an error loading the API key usage data. Please try again."
          action={{
            label: 'Go Back',
            onClick: () => navigate('/dashboard/api-keys'),
          }}
        />
      ) : (
        <>
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary">
              {apiKeyData?.name || 'API Key Usage'}
            </h1>
            <p className="text-text-secondary mt-1 font-mono text-sm">
              sk_live_{apiKeyData?.keyPrefix}...
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Requests"
              value={filteredStats?.totalRequests.toLocaleString() || '0'}
              icon={<RequestsIcon />}
            />
            <StatCard
              label="Avg per Day"
              value={Math.round(filteredStats?.avgPerDay || 0).toLocaleString()}
              icon={<CalendarIcon />}
            />
            <StatCard
              label="Avg Response Time"
              value={`${Math.round(filteredStats?.avgResponseTime || 0)}ms`}
              icon={<ClockIcon />}
            />
            <StatCard
              label="Success Rate"
              value={`${(filteredStats?.successRate || 0).toFixed(1)}%`}
              change={{
                value: filteredStats?.successRate || 0,
                type: (filteredStats?.successRate || 0) > 95 ? 'increase' : 'decrease',
              }}
              icon={<SuccessIcon />}
            />
          </div>

          {/* Usage Chart */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Requests Over Time</CardTitle>
                  <CardDescription>Daily request volume for this API key</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <GhostButton
                    size="sm"
                    variant={dateRange === '7d' ? 'primary' : 'secondary'}
                    onClick={() => setDateRange('7d')}
                  >
                    7 Days
                  </GhostButton>
                  <GhostButton
                    size="sm"
                    variant={dateRange === '30d' ? 'primary' : 'secondary'}
                    onClick={() => setDateRange('30d')}
                  >
                    30 Days
                  </GhostButton>
                  <GhostButton
                    size="sm"
                    variant={dateRange === '90d' ? 'primary' : 'secondary'}
                    onClick={() => setDateRange('90d')}
                  >
                    90 Days
                  </GhostButton>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <UsageChart data={filteredData} height={300} loading={isUsageLoading} />
            </CardContent>
          </Card>

          {/* Top Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Top Endpoints</CardTitle>
              <CardDescription>Most frequently accessed endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              {usageData?.topEndpoints && usageData.topEndpoints.length > 0 ? (
                <DataTable<TopEndpoint>
                  columns={endpointColumns}
                  data={usageData.topEndpoints}
                  rowKey={(row) => `${row.method}-${row.endpoint}`}
                  compact
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary">No endpoint data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}

// Icon components
function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function SettlementsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 18.464a2.992 2.992 0 01-.3 3.197 2.993 2.993 0 01-4.237.225 3 3 0 01-.225-4.237 2.992 2.992 0 013.197-.3l3.72-3.721a6 6 0 015.743-7.743z"
      />
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

function RequestsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function WebhooksIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export default ApiKeyUsagePage;
