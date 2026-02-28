import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Webhook } from '../../types/webhooks';
import { getWebhooks, deleteWebhook, updateWebhook } from '../../api/webhooks';
import {
    AppShell,
    TopBar,
    SidebarNav,
    Button,
    GhostButton,
    DataTable,
    Column,
    Badge,
    ConfirmationModal,
    StatusBadge,
    useToast,
} from '../../components';
import { useAuthStore } from '../../stores/authStore';
import { logout } from '../../api/auth';
import { getErrorMessage } from '../../lib/axios';
import { WebhookModal } from '../../components/webhooks/WebhookModal';
import { SecretRevealDialog } from '../../components/webhooks/SecretRevealDialog';

export const WebhooksListPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const user = useAuthStore((state) => state.user);
    const logoutStore = useAuthStore((state) => state.logout);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

    const [webhookToDelete, setWebhookToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

    const fetchWebhooks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getWebhooks();
            setWebhooks(data.webhooks);
        } catch {
            addToast({
                message: 'Failed to fetch webhook endpoints.',
                variant: 'error',
            });
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchWebhooks();
    }, [fetchWebhooks]);

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
        { label: 'Webhooks', icon: <WebhooksIcon />, href: '/dashboard/webhooks', active: true },
        { label: 'Settings', icon: <SettingsIcon />, href: '/settings' },
        { label: 'Billing', icon: <BillingIcon />, href: '/dashboard/billing' },
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

    const handleCreateNew = () => {
        setSelectedWebhook(null);
        setIsModalOpen(true);
    };

    const handleEdit = (webhook: Webhook) => {
        setSelectedWebhook(webhook);
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!webhookToDelete) return;
        try {
            setIsDeleting(true);
            await deleteWebhook(webhookToDelete);
            addToast({
                message: 'The webhook endpoint has been successfully removed.',
                variant: 'success',
            });
            fetchWebhooks();
        } catch {
            addToast({
                message: 'There was an error deleting the endpoint.',
                variant: 'error',
            });
        } finally {
            setIsDeleting(false);
            setWebhookToDelete(null);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean, ev: React.MouseEvent) => {
        ev.stopPropagation();
        try {
            await updateWebhook(id, { is_active: !currentStatus });
            addToast({
                message: `Webhook endpoint ${!currentStatus ? 'activated' : 'deactivated'}.`,
                variant: 'success',
            });
            fetchWebhooks();
        } catch {
            addToast({
                message: 'Could not toggle the active status of this webhook.',
                variant: 'error',
            });
        }
    };

    const handleWebhookSaved = (secret?: string) => {
        setIsModalOpen(false);
        fetchWebhooks();
        if (secret) {
            setRevealedSecret(secret);
        }
    };

    const columns: Column<Webhook>[] = [
        {
            key: 'url',
            header: 'Endpoint URL',
            render: (url) => (
                <span className="font-mono text-sm break-all">{url as string}</span>
            ),
        },
        {
            key: 'events',
            header: 'Events',
            render: (events) => {
                const evs = events as string[];
                if (evs.length <= 2) {
                    return (
                        <div className="flex flex-wrap gap-1">
                            {evs.map((e) => (
                                <Badge key={e} variant="default">{e}</Badge>
                            ))}
                        </div>
                    );
                }
                return (
                    <div className="flex flex-wrap gap-1">
                        <Badge variant="default">{evs[0]}</Badge>
                        <Badge variant="default">{evs[1]}</Badge>
                        <Badge variant="outline" className="text-xs">+{evs.length - 2} more</Badge>
                    </div>
                );
            },
        },
        {
            key: 'isActive',
            header: 'Status',
            render: (isActive, row) => (
                <div className="flex items-center gap-2">
                    {isActive ? <StatusBadge status="active" /> : <StatusBadge status="inactive" />}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleToggleActive(row.id, isActive as boolean, e)}
                    >
                        {isActive ? 'Pause' : 'Activate'}
                    </Button>
                </div>
            ),
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (date) => (
                <span className="text-sm text-text-secondary whitespace-nowrap">
                    {format(new Date(date as string), 'MMM d, yyyy')}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (_, row) => (
                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(row); }}>
                        Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={(e) => { e.stopPropagation(); setWebhookToDelete(row.id); }}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <AppShell sidebar={sidebar} topBar={topBar}>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-semibold text-text-primary">Webhook Endpoints</h1>
                        <p className="text-sm text-text-secondary mt-1">
                            Manage your webhook endpoints to receive real-time HTTP notifications.
                        </p>
                    </div>
                    <Button onClick={handleCreateNew}>Add Webhook</Button>
                </div>

                <DataTable
                    columns={columns}
                    data={webhooks}
                    rowKey="id"
                    loading={loading}
                    onRowClick={(row) => navigate(`/dashboard/webhooks/${row.id}`)}
                    emptyMessage="No webhook endpoints configured yet."
                    emptyIcon={
                        <svg className="w-12 h-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    }
                />
            </div>

            <WebhookModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                webhook={selectedWebhook}
                onSaved={handleWebhookSaved}
            />

            {webhookToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    title="Delete Webhook"
                    description="Are you sure you want to delete this webhook endpoint? All associated delivery logs will be permanently deleted. This action cannot be undone."
                    confirmText="Delete Webhook"
                    cancelText="Cancel"
                    confirmVariant="danger"
                    loading={isDeleting}
                    onConfirm={handleDeleteConfirm}
                    onClose={() => setWebhookToDelete(null)}
                />
            )}

            {revealedSecret && (
                <SecretRevealDialog
                    secret={revealedSecret}
                    onClose={() => setRevealedSecret(null)}
                />
            )}
        </AppShell>
    );
};

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

function WebhooksIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}

export default WebhooksListPage;
