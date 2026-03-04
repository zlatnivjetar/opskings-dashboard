'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { TicketsByTypeRow } from '@/lib/queries/dashboard';

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#10b981', '#ec4899', '#14b8a6',
  '#a855f7', '#eab308', '#64748b', '#6366f1',
];

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props as {
    cx: number; cy: number; midAngle: number;
    innerRadius: number; outerRadius: number; percentage: number;
  };
  if (percentage < 4) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${(percentage as number).toFixed(1)}%`}
    </text>
  );
}

export function TicketsByTypeChart({ data }: { data: TicketsByTypeRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="typeName"
          innerRadius={60}
          outerRadius={110}
          labelLine={false}
          label={renderCustomLabel}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const v = value as number;
            const row = data.find((r) => r.typeName === (name as string));
            return [`${v.toLocaleString()} (${row?.percentage.toFixed(1)}%)`, name as string];
          }}
          contentStyle={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
