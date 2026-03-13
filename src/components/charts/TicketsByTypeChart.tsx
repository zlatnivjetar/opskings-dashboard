'use client';

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useChartTheme, chartPalette } from '@/hooks/use-chart-theme';
import { makeTooltip } from '@/components/charts/ChartTooltip';
import { ChartTabs } from '@/components/charts/ChartTabs';
import type { TicketsByTypeRow } from '@/lib/queries/dashboard';

type TopN = '5' | '8' | 'all';
type LabelMode = 'pct' | 'count';

const TOP_OPTIONS: { value: TopN; label: string }[] = [
  { value: '5', label: 'Top 5' },
  { value: '8', label: 'Top 8' },
  { value: 'all', label: 'All' },
];
const LABEL_OPTIONS: { value: LabelMode; label: string }[] = [
  { value: 'pct', label: '%' },
  { value: 'count', label: '#' },
];

const RADIAN = Math.PI / 180;

/** Returns true if the hex color is light enough to need dark (black) text. */
function isLightFill(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}

function makeLabel(mode: LabelMode, palette: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function renderLabel(props: any) {
    const { cx, cy, midAngle, innerRadius, outerRadius, percentage, value, index } = props as {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percentage: number;
      value: number;
      index: number;
    };
    if (percentage < 4) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const fill = palette[index] ?? '#1e3a8a';
    const textColor = isLightFill(fill) ? '#000000' : '#ffffff';
    const text = mode === 'pct' ? `${percentage.toFixed(1)}%` : value.toLocaleString();
    return (
      <text
        x={x}
        y={y}
        fill={textColor}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={500}
      >
        {text}
      </text>
    );
  };
}

export function TicketsByTypeChart({ data }: { data: TicketsByTypeRow[] }) {
  const [topN, setTopN] = useState<TopN>('8');
  const [labelMode, setLabelMode] = useState<LabelMode>('pct');
  const colors = useChartTheme();

  const slicedData = useMemo(() => {
    if (topN === 'all') return data;
    const n = Number(topN);
    if (data.length <= n) return data;
    const top = data.slice(0, n);
    const rest = data.slice(n);
    const otherCount = rest.reduce((s, r) => s + r.count, 0);
    const total = data.reduce((s, r) => s + r.count, 0);
    const otherPct = total > 0 ? Math.round((otherCount / total) * 1000) / 10 : 0;
    return [
      ...top,
      { ticketTypeId: -1, typeName: 'Other', count: otherCount, percentage: otherPct },
    ];
  }, [data, topN]);

  const palette = useMemo(
    () => chartPalette(colors, slicedData.length),
    [colors, slicedData.length],
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        <ChartTabs value={topN} onChange={setTopN} options={TOP_OPTIONS} />
        <ChartTabs value={labelMode} onChange={setLabelMode} options={LABEL_OPTIONS} />
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={slicedData}
            dataKey="count"
            nameKey="typeName"
            innerRadius={55}
            outerRadius={105}
            isAnimationActive={false}
            labelLine={false}
            label={makeLabel(labelMode, palette)}
          >
            {slicedData.map((_, i) => (
              <Cell key={i} fill={palette[i]} stroke={colors.tooltipBorder} strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip
            content={makeTooltip(colors, (value, _name, entry) => {
              const v = value as number;
              const pct = entry.payload?.percentage as number | undefined;
              return `${v.toLocaleString()}${pct != null ? ` (${pct.toFixed(1)}%)` : ''}`;
            })}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(value) => (
              <span style={{ color: colors.tooltipText }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
