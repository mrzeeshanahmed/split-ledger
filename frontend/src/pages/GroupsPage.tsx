import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell, TopBar, SidebarNav, EmptyState, GhostButton, useToast } from '@/components';
import { getTenantNavItems } from '@/config/navigation';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/axios';

/**
 * GroupsPage — Placeholder for group management
 */
export function GroupsPage() {
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
            left={<img src="/src/assets/logo.png" alt="Split-Ledger Logo" className="h-8 object-contain" />}
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
                <h1 className="text-2xl font-bold text-text-primary">Groups</h1>
                <p className="text-text-secondary mt-1">Create and manage expense groups</p>
            </div>
            <EmptyState
                title="Coming Soon"
                description="Group management is on its way. You'll be able to create groups, add members, and organize shared expenses by category."
                icon={
                    <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }
            />
        </AppShell>
    );
}

export default GroupsPage;
