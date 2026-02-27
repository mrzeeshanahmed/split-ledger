import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell, TopBar, SidebarNav, EmptyState, GhostButton, useToast } from '@/components';
import { getTenantNavItems } from '@/config/navigation';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/axios';

/**
 * SettingsPage — Placeholder for tenant settings
 */
export function SettingsPage() {
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
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary mt-1">Configure your workspace preferences</p>
            </div>
            <EmptyState
                title="Coming Soon"
                description="Workspace settings are being built. You'll be able to customize your workspace name, manage notifications, and configure integrations."
                icon={
                    <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                }
            />
        </AppShell>
    );
}

export default SettingsPage;
