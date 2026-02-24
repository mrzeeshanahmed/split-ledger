import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppShell,
    TopBar,
    SidebarNav,
    GhostButton,
    useToast,
} from '@/components';
import { useAuthStore } from '@/stores/authStore';
import { logout } from '@/api/auth';
import { getErrorMessage } from '@/lib/axios';
import { BarChart3, Receipt, Users, ReceiptText, Key, Settings, CreditCard } from 'lucide-react';
import { OverviewTab } from '@/components/analytics/OverviewTab';
import { MRRTab } from '@/components/analytics/MRRTab';
import { ChurnTab } from '@/components/analytics/ChurnTab';
import { ApiUsageTab } from '@/components/analytics/ApiUsageTab';

type TabId = 'overview' | 'mrr' | 'churn' | 'apiUsage';

function WebhooksIcon() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}

export function AnalyticsPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const user = useAuthStore((state) => state.user);
    const logoutStore = useAuthStore((state) => state.logout);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    const handleLogout = async () => {
        try {
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

    const sidebarItems = [
        { label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard' },
        { label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, href: '/dashboard/analytics', active: true },
        { label: 'Expenses', icon: <Receipt className="w-5 h-5" />, href: '/expenses' },
        { label: 'Groups', icon: <Users className="w-5 h-5" />, href: '/groups' },
        { label: 'Settlements', icon: <ReceiptText className="w-5 h-5" />, href: '/settlements' },
        { label: 'API Keys', icon: <Key className="w-5 h-5" />, href: '/dashboard/api-keys' },
        { label: 'Webhooks', icon: <WebhooksIcon />, href: '/dashboard/webhooks' },
        { label: 'Settings', icon: <Settings className="w-5 h-5" />, href: '/settings' },
        { label: 'Billing', icon: <CreditCard className="w-5 h-5" />, href: '/dashboard/billing' },
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Analytics Dashboard</h1>
                    <p className="text-text-secondary mt-1">
                        Monitor MRR, tenant growth, and API usage
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Future Date Picker */}
                    <select className="px-3 py-2 bg-bg-primary text-text-primary border border-border-default rounded-md text-sm">
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 3 months</option>
                        <option value="365">Last 12 months</option>
                    </select>
                </div>
            </div>

            <div className="mb-6 border-b border-border-default">
                <nav className="flex space-x-8" aria-label="Tabs">
                    {(
                        [
                            { id: 'overview', name: 'Overview' },
                            { id: 'mrr', name: 'MRR' },
                            { id: 'churn', name: 'Churn' },
                            { id: 'apiUsage', name: 'API Usage' },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                                    ? 'border-brand-500 text-brand-600'
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-hover'
                                }
              `}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'mrr' && <MRRTab />}
            {activeTab === 'churn' && <ChurnTab />}
            {activeTab === 'apiUsage' && <ApiUsageTab />}
        </AppShell>
    );
}
