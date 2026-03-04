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
import type { TicketsByPriorityRow } from '@/lib/queries/dashboard';

export function TicketsByPriorityChart({ data }: { data: TicketsByPriorityRow[] }) {
  const chartData = data.map((r) => ({
    ...r,
    priority: r.priority.charAt(0).toUpperCase() + r.priority.slice(1),
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="priority" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={45} />
        <Tooltip
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="open" name="Open" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
        <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
        <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
