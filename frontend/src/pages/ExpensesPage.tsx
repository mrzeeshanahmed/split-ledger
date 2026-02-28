import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppShell, TopBar, SidebarNav, EmptyState, GhostButton, useToast } from '@/components';
import { getTenantNavItems } from '@/config/navigation';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/axios';

/**
 * ExpensesPage — Placeholder for expense management
 */
export function ExpensesPage() {
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
                <h1 className="text-2xl font-bold text-text-primary">Expenses</h1>
                <p className="text-text-secondary mt-1">Track and manage shared expenses</p>
            </div>
            <EmptyState
                title="Coming Soon"
                description="Expense tracking and splitting will be available here. You'll be able to add expenses, split them with group members, and keep track of who owes what."
                icon={
                    <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                }
            />
        </AppShell>
    );
}

export default ExpensesPage;
