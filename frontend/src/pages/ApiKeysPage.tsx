import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  TopBar,
  SidebarNav,
  DataTable,
  PrimaryButton,
  GhostButton,
  DangerButton,
  Badge,
  StatusBadge,
  EmptyState,
  useToast,
  SkeletonTable,
} from '@/components';
import {
  ApiKeyReveal,
  CreateApiKeyModal,
  RevokeConfirmationModal,
} from '@/components/api-keys';
import { listApiKeys, createApiKey, revokeApiKey, getErrorMessage } from '@/api/apiKeys';
import { useAuthStore } from '@/stores/authStore';
import type { ApiKey, ApiKeyScope, CreateApiKeyInput } from '@/types/apiKeys';

/**
 * ApiKeysPage - API key management list page
 */
export function ApiKeysPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ key: string; name: string } | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null);

  // Fetch API keys
  const {
    data: apiKeysData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => listApiKeys(),
  });

  // Create API key mutation
  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: (data) => {
      setRevealedKey({ key: data.rawKey, name: data.apiKey.name });
      setIsCreateModalOpen(false);
      setIsRevealModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error) => {
      addToast({
        message: getErrorMessage(error),
        variant: 'error',
        duration: 5000,
      });
    },
  });

  // Revoke API key mutation
  const revokeMutation = useMutation({
    mutationFn: (apiKeyId: string) => revokeApiKey(apiKeyId),
    onSuccess: () => {
      setIsRevokeModalOpen(false);
      setKeyToRevoke(null);
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      addToast({
        message: 'API key revoked successfully',
        variant: 'success',
        duration: 3000,
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

  // Handle create submit
  const handleCreateSubmit = async (data: CreateApiKeyInput) => {
    await createMutation.mutateAsync(data);
  };

  // Handle revoke
  const handleRevoke = async () => {
    if (keyToRevoke) {
      await revokeMutation.mutateAsync(keyToRevoke.id);
    }
  };

  // Open revoke modal
  const openRevokeModal = (apiKey: ApiKey) => {
    setKeyToRevoke(apiKey);
    setIsRevokeModalOpen(true);
  };

  // Close revoke modal
  const closeRevokeModal = () => {
    setIsRevokeModalOpen(false);
    setKeyToRevoke(null);
  };

  // Navigate to usage page
  const viewUsage = (apiKeyId: string) => {
    navigate(`/dashboard/api-keys/${apiKeyId}/usage`);
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

  // Table columns
  const columns = [
    {
      key: 'name' as const,
      header: 'Name',
      render: (value: unknown, row: ApiKey) => (
        <div>
          <p className="font-medium text-text-primary">{value as string}</p>
          <p className="text-xs text-text-secondary font-mono">sk_live_{row.keyPrefix}...</p>
        </div>
      ),
    },
    {
      key: 'scopes' as const,
      header: 'Scopes',
      render: (value: unknown) => (
        <div className="flex gap-1 flex-wrap">
          {(value as ApiKeyScope[]).map((scope) => (
            <Badge
              key={scope}
              variant={scope === 'admin' ? 'error' : scope === 'write' ? 'info' : 'default'}
              size="sm"
            >
              {scope}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'lastUsedAt' as const,
      header: 'Last Used',
      render: (value: unknown) =>
        value ? (
          <span className="text-sm text-text-secondary">{formatDate(value as string)}</span>
        ) : (
          <span className="text-sm text-text-muted">Never</span>
        ),
    },
    {
      key: 'createdAt' as const,
      header: 'Created',
      render: (value: unknown) => (
        <span className="text-sm text-text-secondary">{formatDate(value as string)}</span>
      ),
    },
    {
      key: 'isActive' as const,
      header: 'Status',
      render: (value: unknown, row: ApiKey) => {
        if (row.revokedAt) {
          return <StatusBadge status="inactive" />;
        }
        return value ? <StatusBadge status="active" /> : <StatusBadge status="inactive" />;
      },
    },
    {
      key: 'id' as const,
      header: '',
      align: 'right' as const,
      render: (_value: unknown, row: ApiKey) => (
        <div className="flex items-center justify-end gap-2">
          <GhostButton size="sm" onClick={() => viewUsage(row.id)}>
            Usage
          </GhostButton>
          {!row.revokedAt && row.isActive && (
            <DangerButton size="sm" onClick={() => openRevokeModal(row)}>
              Revoke
            </DangerButton>
          )}
        </div>
      ),
    },
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

  return (
    <AppShell sidebar={sidebar} topBar={topBar}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">API Keys</h1>
          <p className="text-text-secondary mt-1">Manage API keys for programmatic access</p>
        </div>
        <PrimaryButton leftIcon={<PlusIcon />} onClick={() => setIsCreateModalOpen(true)}>
          Create New API Key
        </PrimaryButton>
      </div>

      {/* API Keys Table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : error ? (
        <EmptyState
          title="Failed to load API keys"
          description="There was an error loading your API keys. Please try again."
          action={{
            label: 'Retry',
            onClick: () => queryClient.invalidateQueries({ queryKey: ['api-keys'] }),
          }}
        />
      ) : apiKeysData?.apiKeys.length === 0 ? (
        <EmptyState
          title="No API keys yet"
          description="Create your first API key to get started with programmatic access."
          icon={<KeyIcon className="w-16 h-16" />}
          action={{
            label: 'Create API Key',
            onClick: () => setIsCreateModalOpen(true),
          }}
        />
      ) : (
        <DataTable<ApiKey>
          columns={columns}
          data={apiKeysData?.apiKeys || []}
          rowKey="id"
          emptyMessage="No API keys found"
        />
      )}

      {/* Modals */}
      <CreateApiKeyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createMutation.isPending}
      />

      {revealedKey && (
        <ApiKeyReveal
          isOpen={isRevealModalOpen}
          onClose={() => {
            setIsRevealModalOpen(false);
            setRevealedKey(null);
          }}
          apiKey={revealedKey.key}
          keyName={revealedKey.name}
        />
      )}

      {keyToRevoke && (
        <RevokeConfirmationModal
          isOpen={isRevokeModalOpen}
          onClose={closeRevokeModal}
          onConfirm={handleRevoke}
          keyName={keyToRevoke.name}
          loading={revokeMutation.isPending}
        />
      )}
    </AppShell>
  );
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className || 'w-5 h-5'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 18.464a2.992 2.992 0 01-.3 3.197 2.993 2.993 0 01-4.237.225 3 3 0 01-.225-4.237 2.992 2.992 0 013.197-.3l3.72-3.721a6 6 0 015.743-7.743z"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

export default ApiKeysPage;
