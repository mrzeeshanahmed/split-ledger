import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppShell, SidebarNav, TopBar } from '@/components';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

const AdminNavItems = [
    { label: 'Dashboard', href: '/admin', icon: '🏠' },
    { label: 'Tenants', href: '/admin/tenants', icon: '🏢' },
    { label: 'Revenue', href: '/admin/revenue', icon: '💰' },
    { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin, logout } = useAdminAuthStore();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const navItems = AdminNavItems.map((item) => ({
        ...item,
        active: location.pathname === item.href || (item.href !== '/admin' && location.pathname.startsWith(item.href)),
        onClick: () => navigate(item.href),
        icon: <span className="text-lg">{item.icon}</span>,
    }));

    return (
        <AppShell
            sidebar={
                <SidebarNav
                    items={navItems}
                    collapsed={collapsed}
                    onCollapsedChange={setCollapsed}
                />
            }
            topBar={
                <TopBar
                    left={
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-violet-500">⚡</span>
                            <span className="font-semibold text-text-primary">
                                {collapsed ? '' : 'Platform Admin'}
                            </span>
                        </div>
                    }
                    center={title && <h1 className="text-lg font-semibold text-text-primary">{title}</h1>}
                    right={
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-text-secondary">{admin?.name}</span>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    }
                />
            }
        >
            {children}
        </AppShell>
    );
}
