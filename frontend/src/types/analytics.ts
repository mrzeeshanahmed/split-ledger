export interface MRRHistoryPoint {
    date: string;
    totalMrr: number;
}

export interface MRRBreakdown {
    period: string;
    newMrr: number;
    expansionMrr: number;
    contractionMrr: number;
    churnedMrr: number;
    netMrr: number;
}

export interface ChurnRateData {
    period: string;
    churnRate: number;
}

export interface ChurnedTenant {
    id: string;
    name: string;
    plan?: string;
    churnedAt: string;
    mrrLost: number;
}

export interface TopEndpoint {
    method: string;
    endpoint: string;
    count: number;
    errorRate?: number;
}

export interface TimeSeriesVolume {
    time_bucket: string;
    request_count: number;
}

export interface LatencyData {
    endpoint: string;
    method: string;
    p95_response_time_ms: number;
}

export interface MRRResponse {
    currentMrr: number;
    activeSubscriptions: number;
    history: MRRHistoryPoint[];
}

export interface ChurnResponse {
    churnRate: ChurnRateData[];
    churnedTenants: ChurnedTenant[];
}

export interface ApiUsageResponse {
    topEndpoints: TopEndpoint[];
    requestVolume: TimeSeriesVolume[];
    latencyAnalytics: LatencyData[];
}
