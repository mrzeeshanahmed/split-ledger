import api from '@/lib/axios';
import type { MRRResponse, MRRBreakdown, ChurnResponse, ApiUsageResponse } from '@/types/analytics';

export async function getMRR(startDate?: string, endDate?: string): Promise<MRRResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<MRRResponse>(`/analytics/mrr${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
}

export async function getMRRBreakdown(startDate?: string, endDate?: string): Promise<MRRBreakdown[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<MRRBreakdown[]>(`/analytics/mrr/breakdown${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
}

export async function getChurn(startDate?: string, endDate?: string): Promise<ChurnResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await api.get<ChurnResponse>(`/analytics/churn${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
}

export async function getApiUsage(startDate?: string, endDate?: string, granularity?: 'hour' | 'day' | 'week'): Promise<ApiUsageResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (granularity) params.append('granularity', granularity);

    const response = await api.get<ApiUsageResponse>(`/analytics/api-usage${params.toString() ? '?' + params.toString() : ''}`);
    return response.data;
}
