import { query } from '../../db';

export class UsageAnalyticsService {

    /**
     * Top N endpoints by request count
     */
    async getTopEndpoints(limit: number = 10): Promise<any[]> {
        const result = await query(
            `SELECT endpoint, COUNT(*) as request_count,
              AVG(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) * 100 as error_rate,
              AVG(latency_ms) as avg_latency
       FROM api_key_usage
       GROUP BY endpoint
       ORDER BY request_count DESC
       LIMIT $1`,
            [limit]
        );

        return result.rows.map((r: any) => ({
            endpoint: r.endpoint,
            requestCount: parseInt(r.request_count, 10),
            errorRate: parseFloat(r.error_rate),
            avgLatency: Math.round(parseFloat(r.avg_latency))
        }));
    }

    /**
     * Request count over time
     */
    async getRequestVolumeTimeSeries(startDate: string, endDate: string, granularity: 'hour' | 'day' | 'week' = 'day'): Promise<any[]> {
        let dateTrunc = 'day';
        if (granularity === 'hour') dateTrunc = 'hour';
        if (granularity === 'week') dateTrunc = 'week';

        const result = await query(
            `SELECT DATE_TRUNC($1, created_at) as period,
              COUNT(*) as volume
       FROM api_key_usage
       WHERE created_at >= $2 AND created_at <= $3
       GROUP BY period
       ORDER BY period ASC`,
            [dateTrunc, startDate, endDate]
        );

        return result.rows.map((r: any) => ({
            period: r.period.toISOString(),
            volume: parseInt(r.volume, 10)
        }));
    }

    async getP95LatencyByEndpoint(): Promise<any[]> {
        // PostgreSQL has percentile_cont function for this
        const result = await query(
            `SELECT endpoint,
              percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency
       FROM api_key_usage
       GROUP BY endpoint
       ORDER BY p95_latency DESC
       LIMIT 10`
        );

        return result.rows.map((r: any) => ({
            endpoint: r.endpoint,
            p95Latency: Math.round(parseFloat(r.p95_latency))
        }));
    }
}

export const usageAnalyticsService = new UsageAnalyticsService();
