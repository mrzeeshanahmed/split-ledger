import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChurn } from '@/api/analytics';
import { Card, CardHeader, CardTitle, CardContent, DataTable, GhostButton } from '@/components';
import { DownloadIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock cohort data since backend doesn't expose it directly yet
const cohortData = [
    { month: 'Jan 26', users: 120, m1: 98, m2: 95, m3: 90, m4: 88, m5: 85, m6: 82 },
    { month: 'Feb 26', users: 145, m1: 97, m2: 93, m3: 88, m4: 85, m5: 81, m6: null },
    { month: 'Mar 26', users: 110, m1: 99, m2: 96, m3: 92, m4: 90, m5: null, m6: null },
    { month: 'Apr 26', users: 180, m1: 96, m2: 90, m3: 85, m4: null, m5: null, m6: null },
    { month: 'May 26', users: 210, m1: 98, m2: 95, m3: null, m4: null, m5: null, m6: null },
    { month: 'Jun 26', users: 250, m1: 97, m2: null, m3: null, m4: null, m5: null, m6: null },
];

export function ChurnTab() {
    const { data: churnData, isLoading } = useQuery({
        queryKey: ['analytics', 'churn', 'tab'],
        queryFn: () => getChurn(),
    });

    const rawRates = churnData?.churnRate || [];
    const churnedTenants = churnData?.churnedTenants || [];

    const chartData = rawRates.map(d => ({
        name: d.period,
        'Churn Rate %': d.churnRate,
    }));

    const columns = [
        { key: 'name' as const, header: 'Tenant Name' },
        { key: 'plan' as const, header: 'Plan' },
        { key: 'mrrLost' as const, header: 'MRR Lost', render: (val: unknown) => `$${((val as number) / 100).toFixed(2)}` },
        { key: 'churnedAt' as const, header: 'Churn Date', render: (val: unknown) => new Date(val as string).toLocaleDateString() },
    ];

    const exportTable = () => {
        if (!churnedTenants.length) return;
        const headers = ['Tenant Name', 'Plan', 'MRR Lost', 'Churn Date'];
        const rows = churnedTenants.map(t => [
            `"${t.name}"`,
            t.plan || 'N/A',
            (t.mrrLost / 100).toFixed(2),
            new Date(t.churnedAt).toLocaleDateString()
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'churned_tenants.csv';
        a.click();
    };

    const getColorClass = (val: number | null) => {
        if (val === null) return 'bg-transparent';
        if (val >= 95) return 'bg-brand-500 text-white';
        if (val >= 90) return 'bg-brand-400 text-white';
        if (val >= 85) return 'bg-brand-300 text-brand-900';
        if (val >= 80) return 'bg-brand-200 text-brand-900';
        return 'bg-brand-100 text-brand-900';
    };

    if (isLoading) return <div className="text-text-muted p-8 text-center border border-border-default rounded-lg">Loading Churn stats...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Churn Rate (%)</CardTitle>
                </CardHeader>
                <CardContent>
                    {chartData.length === 0 ? (
                        <div className="h-72 flex items-center justify-center text-text-muted">No churn data available</div>
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Line type="monotone" dataKey="Churn Rate %" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Retention Cohorts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-default">
                                    <th className="py-3 px-4 font-medium text-text-secondary">Cohort</th>
                                    <th className="py-3 px-4 font-medium text-text-secondary">Users</th>
                                    <th className="py-3 px-4 font-medium text-text-secondary text-center">Month 1</th>
                                    <th className="py-3 px-4 font-medium text-text-secondary text-center">Month 2</th>
                                    <th className="py-3 px-4 font-medium text-text-secondary text-center">Month 3</th>
                                    <th className="py-3 px-4 font-medium text-text-secondary text-center">Month 4</th>
                                    <th className="py-3 px-4 font-medium text-text-secondary text-center">Month 5</th>
                                    <th className="py-3 px-4 font-medium text-text-secondary text-center">Month 6</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohortData.map((row) => (
                                    <tr key={row.month} className="border-b border-border-default last:border-0">
                                        <td className="py-3 px-4 font-medium">{row.month}</td>
                                        <td className="py-3 px-4 text-text-secondary">{row.users}</td>
                                        {[row.m1, row.m2, row.m3, row.m4, row.m5, row.m6].map((val, idx) => (
                                            <td key={idx} className="p-1">
                                                <div className={`h-10 w-full flex items-center justify-center rounded-md ${getColorClass(val)}`}>
                                                    {val !== null ? `${val}%` : '-'}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Churned Tenants</CardTitle>
                    <GhostButton size="sm" leftIcon={<DownloadIcon className="w-4 h-4" />} onClick={exportTable}>
                        Export CSV
                    </GhostButton>
                </CardHeader>
                <CardContent>
                    <DataTable data={churnedTenants as any[]} columns={columns} rowKey="id" emptyMessage="No churned tenants found" />
                </CardContent>
            </Card>
        </div>
    );
}
