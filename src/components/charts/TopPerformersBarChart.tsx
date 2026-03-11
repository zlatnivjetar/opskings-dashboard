'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartTabs } from '@/components/charts/ChartTabs';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { formatHours, formatUsername } from '@/lib/format';
import type { TeamPerformanceRow } from '@/lib/queries/team';
import { getTopByFastest, getTopByRating, getTopByResolved } from '@/lib/team-performance-ranking';

type PerformerMetric = 'rating' | 'resolved' | 'fastest';

type ChartRow = {
  id: number;
  name: string;
  value: number;
  valueLabel: string;
};

const METRIC_OPTIONS: { value: PerformerMetric; label: string }[] = [
  { value: 'rating', label: 'Rating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'fastest', label: 'Fastest' },
];

function buildChartRows(
  rows: TeamPerformanceRow[],
  metric: PerformerMetric,
  limit: number,
): ChartRow[] {
  const boundedLimit = Math.max(1, limit);

  if (metric === 'rating') {
    return getTopByRating(rows, boundedLimit).map((row) => ({
      id: row.id,
      name: formatUsername(row.username),
      value: row.avgRating ?? 0,
      valueLabel: (row.avgRating ?? 0).toFixed(2),
    }));
  }

  if (metric === 'resolved') {
    return getTopByResolved(rows, boundedLimit).map((row) => ({
      id: row.id,
      name: formatUsername(row.username),
      value: row.resolved,
      valueLabel: row.resolved.toLocaleString(),
    }));
  }

  const fastestRows = getTopByFastest(rows, boundedLimit);
  const slowestTopTime = fastestRows.reduce(
    (max, row) => Math.max(max, row.avgResolutionHours ?? 0),
    0,
  );

  return fastestRows.map((row) => {
    const avgHours = row.avgResolutionHours ?? 0;
    return {
      id: row.id,
      name: formatUsername(row.username),
      value: Math.max(0, slowestTopTime - avgHours),
      valueLabel: formatHours(avgHours),
    };
  });
}

export function TopPerformersBarChart({ limit = 3 }: { limit?: number }) {
  const [metric, setMetric] = useState<PerformerMetric>('rating');
  const colors = useChartTheme();

  const { data = [], isLoading } = useQuery({
    queryKey: ['team', 'performance'],
    queryFn: async () => {
      const res = await fetch('/api/team/performance');
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json() as Promise<TeamPerformanceRow[]>;
    },
    staleTime: 30_000,
  });

  const chartData = useMemo(() => buildChartRows(data, metric, limit), [data, metric, limit]);

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Top Performers</CardTitle>
          <ChartTabs value={metric} onChange={setMetric} options={METRIC_OPTIONS} />
        </div>
        <p className="text-caption">Top {limit} performers in current dataset</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leaderboard data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 6, right: 32, left: 12, bottom: 6 }}
              barCategoryGap={14}
            >
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={{ fontSize: 11, fill: colors.axis }}
                tickLine={false}
                axisLine={false}
              />
              <Bar dataKey="value" fill={colors.chart3} radius={[0, 6, 6, 0]}>
                <LabelList
                  dataKey="valueLabel"
                  position="right"
                  offset={8}
                  style={{ fill: colors.axis, fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
