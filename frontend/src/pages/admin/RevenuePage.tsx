import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent, StatCard } from '@/components';
import { getRevenueSummary, getRevenueByTenant, getRevenueTrends } from '@/api/admin';

export function RevenuePage() {
    const [summary, setSummary] = useState<any>(null);
    const [breakdown, setBreakdown] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, breakdownRes, trendsRes] = await Promise.all([
                    getRevenueSummary(),
                    getRevenueByTenant(),
                    getRevenueTrends(),
                ]);
                setSummary(summaryRes.data.summary);
                setBreakdown(breakdownRes.data.breakdown);
                setTrends(trendsRes.data.trends);
            } catch (err) {
                console.error('Failed to fetch revenue data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <AdminLayout title="Revenue">
                <div className="flex items-center justify-center h-64">
                    <div className="text-text-secondary">Loading revenue data...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Revenue">
            <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Total Volume"
                        value={`$${(summary?.totalRevenue ?? 0).toFixed(2)}`}
                        className="bg-white"
                    />
                    <StatCard
                        label="Platform Fees (15%)"
                        value={`$${(summary?.platformFeeCollected ?? 0).toFixed(2)}`}
                        className="bg-white"
                    />
                    <StatCard
                        label="Tenant Payouts (85%)"
                        value={`$${(summary?.tenantPayouts ?? 0).toFixed(2)}`}
                        className="bg-white"
                    />
                </div>

                {/* Monthly Trends */}
                <Card>
                    <CardHeader>
                        <CardTitle>Monthly Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {trends.length === 0 ? (
                            <p className="text-text-secondary text-sm">No revenue data yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-default">
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Month</th>
                                            <th className="text-right py-2 px-3 font-medium text-text-secondary">Volume</th>
                                            <th className="text-right py-2 px-3 font-medium text-text-secondary">Platform Fee</th>
                                            <th className="text-right py-2 px-3 font-medium text-text-secondary">Tenant Payout</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trends.map((t: any) => (
                                            <tr key={t.month} className="border-b border-border-subtle">
                                                <td className="py-2 px-3 font-medium">{t.month}</td>
                                                <td className="py-2 px-3 text-right">${t.revenue.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-right text-green-600">${t.platformFee.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-right">${t.tenantPayout.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Per-Tenant Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue by Tenant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {breakdown.length === 0 ? (
                            <p className="text-text-secondary text-sm">No tenants yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-default">
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Tenant</th>
                                            <th className="text-left py-2 px-3 font-medium text-text-secondary">Status</th>
                                            <th className="text-right py-2 px-3 font-medium text-text-secondary">Total Revenue</th>
                                            <th className="text-right py-2 px-3 font-medium text-text-secondary">Platform Fee</th>
                                            <th className="text-right py-2 px-3 font-medium text-text-secondary">Tenant Payout</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {breakdown.map((b: any) => (
                                            <tr key={b.tenantId} className="border-b border-border-subtle hover:bg-background-subtle">
                                                <td className="py-2 px-3">
                                                    <div className="font-medium">{b.name}</div>
                                                    <div className="text-xs text-text-muted">{b.subdomain}</div>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${b.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {b.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-right">${b.revenue.total.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-right text-green-600">${b.revenue.platform_fee.toFixed(2)}</td>
                                                <td className="py-2 px-3 text-right">${b.revenue.tenant_payout.toFixed(2)}</td>
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

export default RevenuePage;
