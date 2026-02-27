import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components';
import { getRevenueSummary, getAdminTenants } from '@/api/admin';

export function AdminDashboardPage() {
    const [summary, setSummary] = useState<any>(null);
    const [recentTenants, setRecentTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [revenueRes, tenantsRes] = await Promise.all([
                    getRevenueSummary(),
                    getAdminTenants({ page: 1, limit: 5 }),
                ]);
                setSummary(revenueRes.data.summary);
                setRecentTenants(tenantsRes.data.tenants);
            } catch (err) {
                console.error('Failed to fetch admin dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <AdminLayout title="Dashboard">
                <div className="flex items-center justify-center h-64">
                    <div className="text-text-secondary">Loading dashboard...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard">
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Tenants"
                        value={summary?.totalTenants ?? 0}
                        className="bg-white"
                    />
                    <StatCard
                        label="Active Tenants"
                        value={summary?.activeTenants ?? 0}
                        className="bg-white"
                    />
                    <StatCard
                        label="Platform Revenue"
                        value={`$${(summary?.platformFeeCollected ?? 0).toFixed(2)}`}
                        className="bg-white"
                    />
                    <StatCard
                        label="Total Volume"
                        value={`$${(summary?.totalRevenue ?? 0).toFixed(2)}`}
                        className="bg-white"
                    />
                </div>

                {/* Recent Tenants */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Tenants</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentTenants.length === 0 ? (
                            <p className="text-text-secondary text-sm">No tenants yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-default">
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Name</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Subdomain</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Status</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTenants.map((t: any) => (
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
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}

export default AdminDashboardPage;
