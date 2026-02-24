import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiUsage } from '@/api/analytics';
import { Card, CardHeader, CardTitle, CardContent, DataTable, GhostButton } from '@/components';
import { DownloadIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export function ApiUsageTab() {
    const { data: usageData, isLoading } = useQuery({
        queryKey: ['analytics', 'api-usage', 'tab'],
        queryFn: () => getApiUsage(),
    });

    const volume = usageData?.requestVolume || [];
    const endpoints = usageData?.topEndpoints || [];
    const latencies = usageData?.latencyAnalytics || [];

    const volumeChartData = volume.map(d => ({
        name: new Date(d.time_bucket).toLocaleDateString(),
        'Requests': d.request_count,
    }));

    const endpointChartData = endpoints.map(d => ({
        name: d.endpoint,
        'Requests': d.count,
        'Error Rate': d.errorRate || Math.random() * 5 // Mock error rate since it's missing from DB query MVP
    }));

    const latencyColumns = [
        { key: 'method' as const, header: 'Method' },
        { key: 'endpoint' as const, header: 'Endpoint' },
        { key: 'p95_response_time_ms' as const, header: 'P95 Latency (ms)', render: (val: unknown) => `${Math.round(val as number)}ms` },
    ];

    const exportLatencies = () => {
        if (!latencies.length) return;
        const headers = ['Method', 'Endpoint', 'P95 Latency (ms)'];
        const rows = latencies.map(t => [`"${t.method}"`, `"${t.endpoint}"`, Math.round(t.p95_response_time_ms)]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'api_latency.csv';
        a.click();
    };

    if (isLoading) return <div className="text-text-muted p-8 text-center border border-border-default rounded-lg">Loading API Usage...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Request Volume</CardTitle>
                </CardHeader>
                <CardContent>
                    {volumeChartData.length === 0 ? (
                        <div className="h-72 flex items-center justify-center text-text-muted">No request data</div>
                    ) : (
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={volumeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Line type="stepAfter" dataKey="Requests" stroke="#6366f1" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top 10 Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {endpointChartData.length === 0 ? (
                            <div className="h-72 flex items-center justify-center text-text-muted">No endpoints data</div>
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart layout="vertical" data={endpointChartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={100} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                        <Bar dataKey="Requests" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Error Rates (Mocked)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {endpointChartData.length === 0 ? (
                            <div className="h-72 flex items-center justify-center text-text-muted">No error data</div>
                        ) : (
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={endpointChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} angle={-45} textAnchor="end" height={60} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `${val}%`} />
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(val: any) => `${val.toFixed(2)}%`} />
                                        <Bar dataKey="Error Rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                            {endpointChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry['Error Rate'] > 2 ? '#ef4444' : '#10b981'} />
                                            ))}
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
                    <CardTitle>Latency Distribution (P95)</CardTitle>
                    <GhostButton size="sm" leftIcon={<DownloadIcon className="w-4 h-4" />} onClick={exportLatencies}>
                        Export CSV
                    </GhostButton>
                </CardHeader>
                <CardContent>
                    <DataTable data={latencies} columns={latencyColumns} rowKey={(row: any) => `${row.method}-${row.endpoint}`} emptyMessage="No latency data found" />
                </CardContent>
            </Card>
        </div>
    );
}
