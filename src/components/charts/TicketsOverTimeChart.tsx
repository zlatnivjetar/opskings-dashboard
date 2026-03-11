'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { makeTooltip } from '@/components/charts/ChartTooltip';
import { ChartTabs } from '@/components/charts/ChartTabs';
import type { TicketsOverTimeRow } from '@/lib/queries/dashboard';

type View = 'all' | 'created' | 'resolved';

const VIEW_OPTIONS: { value: View; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'created', label: 'Created' },
  { value: 'resolved', label: 'Resolved' },
];

function formatMonth(dateStr: string): string {
  const [year, month] = dateStr.split('-');
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function TicketsOverTimeChart({ data }: { data: TicketsOverTimeRow[] }) {
  const [view, setView] = useState<View>('all');
  const colors = useChartTheme();

  const chartData = useMemo(
    () => data.map((r) => ({ ...r, monthLabel: formatMonth(r.month) })),
    [data],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <ChartTabs value={view} onChange={setView} options={VIEW_OPTIONS} />
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          accessibilityLayer={false}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 12, fill: colors.axis }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: colors.axis }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip
            content={makeTooltip(colors)}
            cursor={{ fill: colors.created, fillOpacity: 0.12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {(view === 'all' || view === 'created') && (
            <Bar
              dataKey="created"
              name="Created"
              fill={colors.created}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          )}
          {(view === 'all' || view === 'resolved') && (
            <Bar
              dataKey="resolved"
              name="Resolved"
              fill={colors.resolved}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
