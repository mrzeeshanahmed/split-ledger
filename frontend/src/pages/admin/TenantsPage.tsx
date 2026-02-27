import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, PrimaryButton } from '@/components';
import { getAdminTenants, updateTenantStatus } from '@/api/admin';

export function TenantsPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTenants = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await getAdminTenants({ page, limit: pagination.limit, search });
            setTenants(res.data.tenants);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error('Failed to fetch tenants', err);
        } finally {
            setLoading(false);
        }
    }, [search, pagination.limit]);

    useEffect(() => { fetchTenants(); }, [fetchTenants]);

    const handleStatusChange = async (tenantId: string, status: string) => {
        try {
            await updateTenantStatus(tenantId, status);
            fetchTenants(pagination.page);
        } catch (err) {
            console.error('Failed to update tenant status', err);
        }
    };

    return (
        <AdminLayout title="Tenants">
            <div className="space-y-4">
                {/* Search */}
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 px-3 py-2 border border-border-default rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                    />
                    <PrimaryButton onClick={() => fetchTenants(1)}>Search</PrimaryButton>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Tenants ({pagination.total})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-text-secondary">Loading...</p>
                        ) : tenants.length === 0 ? (
                            <p className="text-text-secondary">No tenants found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-default">
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Name</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Subdomain</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Status</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Created</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tenants.map((t: any) => (
                                            <tr key={t.id} className="border-b border-border-subtle hover:bg-background-subtle">
                                                <td className="py-2 px-3 font-medium">{t.name}</td>
                                                <td className="py-2 px-3 text-text-secondary">{t.subdomain}</td>
                                                <td className="py-2 px-3">
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${t.status === 'active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : t.status === 'suspended'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-text-secondary">
                                                    {new Date(t.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="py-2 px-3">
                                                    <select
                                                        value={t.status}
                                                        onChange={(e) => handleStatusChange(t.id, e.target.value)}
                                                        className="text-xs border border-border-default rounded px-2 py-1 bg-white"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="suspended">Suspended</option>
                                                        <option value="deactivated">Deactivated</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-default">
                                <span className="text-sm text-text-secondary">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchTenants(pagination.page - 1)}
                                        disabled={pagination.page <= 1}
                                        className="px-3 py-1 text-sm border border-border-default rounded-lg disabled:opacity-50 hover:bg-background-subtle"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => fetchTenants(pagination.page + 1)}
                                        disabled={pagination.page >= pagination.totalPages}
                                        className="px-3 py-1 text-sm border border-border-default rounded-lg disabled:opacity-50 hover:bg-background-subtle"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

export default TenantsPage;
