import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    AppShell,
    TopBar,
    SidebarNav,
    EmptyState,
    GhostButton,
    PrimaryButton,
    SkeletonCard,
    useToast,
} from '@/components';
import { getTenantNavItems } from '@/config/navigation';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/lib/axios';
import api from '@/lib/axios';

interface TenantUser {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    status: string;
    last_login_at: string | null;
    created_at: string;
}

async function fetchUsers(): Promise<TenantUser[]> {
    const response = await api.get<{ users: TenantUser[] }>('/users');
    return response.data.users || [];
}

/**
 * UsersPage — Tenant user management
 */
export function UsersPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const user = useAuthStore((state) => state.user);
    const logoutStore = useAuthStore((state) => state.logout);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['tenant-users'],
        queryFn: fetchUsers,
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

    const filteredUsers = (users || []).filter(
        (u) =>
            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            owner: 'bg-purple-100 text-fuchsia-700',
            admin: 'bg-blue-100 text-blue-700',
            member: 'bg-gray-100 text-gray-700',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || colors.member}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            suspended: 'bg-red-100 text-red-700',
            invited: 'bg-yellow-100 text-yellow-700',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <AppShell sidebar={sidebar} topBar={topBar}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Users</h1>
                    <p className="text-text-secondary mt-1">Manage workspace members and roles</p>
                </div>
                <PrimaryButton size="sm" onClick={() => addToast({ message: 'Invite modal coming soon', variant: 'info', duration: 3000 })}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Invite User
                </PrimaryButton>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-md px-4 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : error ? (
                <EmptyState
                    title="Failed to load users"
                    description="There was an error loading the user list. Please try again."
                />
            ) : filteredUsers.length === 0 ? (
                <EmptyState
                    title={searchQuery ? 'No users found' : 'No users yet'}
                    description={searchQuery ? 'Try a different search term.' : 'Invite team members to start collaborating.'}
                    icon={
                        <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    }
                />
            ) : (
                <div className="bg-white border border-border-default rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-border-default">
                        <thead className="bg-background-subtle">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-border-default">
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-background-subtle transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                <span className="text-sm font-medium text-violet-400">
                                                    {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-text-primary">{u.first_name} {u.last_name}</div>
                                                <div className="text-sm text-text-secondary">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(u.role)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(u.status)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(u.last_login_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(u.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AppShell>
    );
}

export default UsersPage;
