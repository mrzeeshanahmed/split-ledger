import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  TopBar,
  SidebarNav,
  DataTable,
  Badge,
  GhostButton,
  SelectField,
  SkeletonTable,
  EmptyState,
  useToast,
} from '@/components';
import { getInvoices, retryInvoicePayment, getErrorMessage } from '@/api/billing';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { Invoice, InvoiceStatus } from '@/types/billing';
import type { BadgeVariant } from '@/components/ui/Badge';

const PAGE_SIZE = 20;

/**
 * InvoicesPage - Invoice history with filtering and pagination
 */
export function InvoicesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  const {
    data: invoicesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invoices', currentPage, statusFilter],
    queryFn: () => getInvoices({ page: currentPage, limit: PAGE_SIZE, status: statusFilter }),
  });

  const retryMutation = useMutation({
    mutationFn: retryInvoicePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      addToast({ message: 'Payment retry initiated', variant: 'success', duration: 3000 });
    },
    onError: (error) => {
      addToast({ message: getErrorMessage(error), variant: 'error', duration: 5000 });
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
      left={<img src="/logo.png" alt="Split-Ledger Logo" className="h-8 object-contain" />}
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

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (cents: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const getStatusBadgeVariant = (status: InvoiceStatus): BadgeVariant => {
    switch (status) {
      case 'paid': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      case 'open': return 'default';
    }
  };

  const columns = [
    {
      key: 'date' as const,
      header: 'Date',
      render: (value: unknown) => (
        <span className="text-sm text-text-primary">{formatDate(value as string)}</span>
      ),
    },
    {
      key: 'periodStart' as const,
      header: 'Period',
      render: (_value: unknown, row: Invoice) => (
        <span className="text-sm text-text-secondary">
          {formatDate(row.periodStart)} &mdash; {formatDate(row.periodEnd)}
        </span>
      ),
    },
    {
      key: 'amountCents' as const,
      header: 'Amount',
      render: (_value: unknown, row: Invoice) => (
        <span className="text-sm font-medium text-text-primary">
          {formatAmount(row.amountCents, row.currency)}
        </span>
      ),
    },
    {
      key: 'status' as const,
      header: 'Status',
      render: (value: unknown) => {
        const status = value as InvoiceStatus;
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'id' as const,
      header: '',
      align: 'right' as const,
      render: (_value: unknown, row: Invoice) => (
        <div className="flex items-center justify-end gap-2">
          {row.pdfUrl && (
            <GhostButton
              size="sm"
              onClick={() => window.open(row.pdfUrl!, '_blank')}
            >
              Download PDF
            </GhostButton>
          )}
          {row.status === 'failed' && (
            <GhostButton
              size="sm"
              onClick={() => retryMutation.mutate(row.id)}
              loading={retryMutation.isPending}
            >
              Retry
            </GhostButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      <div className="flex items-center gap-4 mb-6">
        <GhostButton size="sm" onClick={() => navigate('/dashboard/billing')} leftIcon={<BackIcon />}>
          Back to Billing
        </GhostButton>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Invoice History</h1>
          <p className="text-text-secondary mt-1">View and download your past invoices</p>
        </div>
        <div className="w-40">
          <SelectField
            label=""
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as InvoiceStatus | 'all');
              setCurrentPage(1);
            }}
            options={[
              { value: 'all', label: 'All Invoices' },
              { value: 'paid', label: 'Paid' },
              { value: 'failed', label: 'Failed' },
              { value: 'pending', label: 'Pending' },
              { value: 'open', label: 'Open' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : error ? (
        <EmptyState
          title="Failed to load invoices"
          description="There was an error loading your invoice history. Please try again."
          action={{
            label: 'Retry',
            onClick: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
          }}
        />
      ) : (
        <DataTable<Invoice>
          columns={columns}
          data={invoicesData?.invoices || []}
          rowKey="id"
          emptyMessage="No invoices found"
          pagination={
            invoicesData
              ? {
                pageSize: PAGE_SIZE,
                currentPage,
                totalItems: invoicesData.total,
                onPageChange: setCurrentPage,
              }
              : undefined
          }
        />
      )}
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

function WebhooksIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

export default InvoicesPage;
