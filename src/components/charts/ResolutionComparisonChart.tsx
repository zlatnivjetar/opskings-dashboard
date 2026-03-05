'use client';

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
import type { ResolutionStatRow } from '@/lib/queries/response-time';

export function ResolutionComparisonChart({ data }: { data: ResolutionStatRow[] }) {
  const chartData = data.map((r) => ({
    priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
    'Actual Avg': Math.round(r.avgHours * 10) / 10,
    Expected: Math.round(r.expectedHours * 10) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="priority" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={50}
          tickFormatter={(v) => `${v}h`}
        />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: 12,
          }}
          formatter={(value) => [`${value}h`, undefined]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Actual Avg" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expected" fill="#94a3b8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
