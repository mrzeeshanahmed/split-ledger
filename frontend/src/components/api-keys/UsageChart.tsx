import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { RequestsByDay } from '@/types/apiKeys';

/**
 * Props for UsageChart component
 */
export interface UsageChartProps {
  /** Data points for the chart */
  data: RequestsByDay[];
  /** Chart height in pixels */
  height?: number;
  /** Loading state */
  loading?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * UsageChart - SVG line chart for displaying request data
 *
 * A simple, dependency-free line chart component.
 */
export function UsageChart({ data, height = 200, loading, className }: UsageChartProps) {
  // Process data for the chart
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort by date ascending
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Fill in missing dates with 0 counts
    const filled: RequestsByDay[] = [];
    const startDate = new Date(sorted[0].date);
    const endDate = new Date(sorted[sorted.length - 1].date);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = sorted.find((item) => item.date === dateStr);
      filled.push({
        date: dateStr,
        count: existing ? existing.count : 0,
      });
    }

    return filled;
  }, [data]);

  // Calculate chart dimensions and scales
  const { path, areaPath, maxValue, yTicks, points } = useMemo(() => {
    if (chartData.length === 0) {
      return { path: '', areaPath: '', maxValue: 0, yTicks: [], points: [] };
    }

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 800;
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;

    const maxCount = Math.max(...chartData.map((d) => d.count));
    const maxValue = maxCount === 0 ? 1 : Math.ceil(maxCount * 1.1); // Add 10% padding

    // Generate Y-axis ticks
    const tickCount = 5;
    const yTicks = Array.from({ length: tickCount }, (_, i) =>
      Math.round((maxValue / (tickCount - 1)) * i)
    );

    // Calculate points
    const points = chartData.map((d, i) => ({
      x: padding.left + (i / (chartData.length - 1 || 1)) * chartWidth,
      y: padding.top + chartHeight - (d.count / maxValue) * chartHeight,
      value: d.count,
      date: d.date,
    }));

    // Generate path
    const path = points.reduce((acc, point, i) => {
      if (i === 0) return `M ${point.x} ${point.y}`;
      // Use smooth bezier curves
      const prev = points[i - 1];
      const cp1x = prev.x + (point.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = prev.x + (2 * (point.x - prev.x)) / 3;
      const cp2y = point.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
    }, '');

    // Generate area path
    const areaPath = `${path} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${points[0]?.x || 0} ${padding.top + chartHeight} Z`;

    return { path, areaPath, maxValue, yTicks, points };
  }, [chartData, height]);

  // Show loading skeleton
  if (loading) {
    return (
      <div
        className={cn('bg-white rounded-lg border border-border-default p-4', className)}
        style={{ height }}
      >
        <div className="animate-pulse h-full flex items-end gap-2">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-secondary-200 rounded-t"
              style={{
                height: `${Math.random() * 60 + 20}%`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state
  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'bg-white rounded-lg border border-border-default p-4 flex items-center justify-center',
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-text-secondary text-sm">No usage data available</p>
        </div>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartHeight = height - padding.top - padding.bottom;

  return (
    <div className={cn('bg-white rounded-lg border border-border-default p-4', className)}>
      <svg
        viewBox={`0 0 800 ${height}`}
        className="w-full"
        style={{ height: 'auto', minHeight: height }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = padding.top + chartHeight - (tick / maxValue) * chartHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={800 - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4,4"
              />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-text-secondary">
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <g key={i}>
            <circle cx={point.x} cy={point.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
            <title>{`${formatDate(point.date)}: ${point.value} requests`}</title>
          </g>
        ))}

        {/* X-axis labels (show every nth label to avoid overcrowding) */}
        {points.map((point, i) => {
          const showLabel =
            chartData.length <= 10 ||
            i === 0 ||
            i === points.length - 1 ||
            i % Math.ceil(points.length / 7) === 0;

          if (!showLabel) return null;

          return (
            <text
              key={i}
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-xs fill-text-secondary"
              transform={`rotate(-45, ${point.x}, ${height - 10})`}
            >
              {formatDate(point.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default UsageChart;
