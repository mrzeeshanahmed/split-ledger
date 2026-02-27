/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMRRBreakdown } from '@/api/analytics';
import { Card, CardHeader, CardTitle, CardContent, DataTable, GhostButton } from '@/components';
import { DownloadIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ReferenceLine, Cell } from 'recharts';

export function MRRTab() {
    const { data: breakdownData, isLoading } = useQuery({
        queryKey: ['analytics', 'mrr-breakdown'],
        queryFn: () => getMRRBreakdown(),
    });

    const rawData = breakdownData || [];

    // Format for charts
    const chartData = rawData.map(d => ({
        name: d.period,
        New: d.newMrr / 100,
        Expansion: d.expansionMrr / 100,
        Contraction: -(d.contractionMrr / 100), // Negative for chart
        Churned: -(d.churnedMrr / 100), // Negative for chart
        Net: d.netMrr / 100,
    }));

    // Simple Waterfall simulation for current month
    // We take the latest month and show the net components
    const currentMonth = rawData.length > 0 ? rawData[rawData.length - 1] : null;
    const waterfallData = currentMonth ? [
        { name: 'New', value: currentMonth.newMrr / 100, fill: '#10b981' },
        { name: 'Expansion', value: currentMonth.expansionMrr / 100, fill: '#3b82f6' },
        { name: 'Contraction', value: -(currentMonth.contractionMrr / 100), fill: '#f59e0b' },
        { name: 'Churned', value: -(currentMonth.churnedMrr / 100), fill: '#ef4444' },
        { name: 'Net Change', value: currentMonth.netMrr / 100, fill: currentMonth.netMrr >= 0 ? '#10b981' : '#ef4444' }
    ] : [];

    const columns = [
        { key: 'period' as const, header: 'Month' },
        { key: 'newMrr' as const, header: 'New MRR', render: (val: unknown) => `$${((val as number) / 100).toFixed(2)}` },
        { key: 'expansionMrr' as const, header: 'Expansion', render: (val: unknown) => `$${((val as number) / 100).toFixed(2)}` },
        { key: 'contractionMrr' as const, header: 'Contraction', render: (val: unknown) => `$${((val as number) / 100).toFixed(2)}` },
        { key: 'churnedMrr' as const, header: 'Churned', render: (val: unknown) => `$${((val as number) / 100).toFixed(2)}` },
        {
            key: 'netMrr' as const, header: 'Net Change', render: (val: unknown) => {
                const net = (val as number) / 100;
                return <span className={net >= 0 ? "text-success-600" : "text-danger-600"}>{net >= 0 ? '+' : ''}${net.toFixed(2)}</span>;
            }
        },
    ];

    const exportCsv = () => {
        if (!rawData.length) return;
        const headers = ['Month', 'New MRR', 'Expansion', 'Contraction', 'Churned', 'Net Change'];
        const rows = rawData.map(d => [
            d.period,
            (d.newMrr / 100).toFixed(2),
            (d.expansionMrr / 100).toFixed(2),
            (d.contractionMrr / 100).toFixed(2),
            (d.churnedMrr / 100).toFixed(2),
            (d.netMrr / 100).toFixed(2)
        ]);
        const csvContext = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContext], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mrr_breakdown.csv';
        a.click();
    };

    if (isLoading) return <div className="text-text-muted p-8 text-center border border-border-default rounded-lg">Loading MRR stats...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>MRR Movements</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${Math.abs(val)}`} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <ReferenceLine y={0} stroke="#9ca3af" />
                                    <Area type="monotone" dataKey="New" stackId="1" stroke="#10b981" fill="#10b981" />
                                    <Area type="monotone" dataKey="Expansion" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                                    <Area type="monotone" dataKey="Contraction" stackId="2" stroke="#f59e0b" fill="#f59e0b" />
                                    <Area type="monotone" dataKey="Churned" stackId="2" stroke="#ef4444" fill="#ef4444" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Current Month Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {waterfallData.length === 0 ? (
                            <div className="h-80 flex items-center justify-center text-text-muted">No current month data</div>
                        ) : (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `$${Math.abs(val)}`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(val: number | undefined) => [`$${Math.abs(Number(val || 0)).toFixed(2)}`, 'Value']}
                                        />
                                        <ReferenceLine y={0} stroke="#9ca3af" />
                                        <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                            {
                                                waterfallData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))
                                            }
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>MRR Breakdown History</CardTitle>
                    <GhostButton size="sm" leftIcon={<DownloadIcon className="w-4 h-4" />} onClick={exportCsv}>
                        Export CSV
                    </GhostButton>
                </CardHeader>
                <CardContent>
                    <DataTable data={rawData as any[]} columns={columns as any[]} rowKey="period" emptyMessage="No data available" />
                </CardContent>
            </Card>
        </div>
    );
}
