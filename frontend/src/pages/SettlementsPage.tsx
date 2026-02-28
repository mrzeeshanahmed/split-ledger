import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell, TopBar, SidebarNav, EmptyState, GhostButton, useToast } from '@/components';
import { getTenantNavItems } from '@/config/navigation';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/axios';

/**
 * SettlementsPage — Placeholder for settlement management
 */
export function SettlementsPage() {
    const location = useLocation();
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

    const sidebar = (
        <SidebarNav
            items={getTenantNavItems(location.pathname)}
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
                    <GhostButton size="sm" onClick={handleLogout}>Logout</GhostButton>
                </div>
            }
        />
    );

    return (
        <AppShell sidebar={sidebar} topBar={topBar}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">Settlements</h1>
                <p className="text-text-secondary mt-1">Record and track payments between members</p>
            </div>
            <EmptyState
                title="Coming Soon"
                description="Settlement tracking is in development. You'll be able to record payments, view outstanding balances, and simplify group debts."
                icon={
                    <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            />
        </AppShell>
    );
}

export default SettlementsPage;
