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
import { formatCompact } from '@/lib/format';
import type { HistogramRow } from '@/lib/queries/response-time';

type Granularity = 'fine' | 'standard' | 'coarse';

const GRAN_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'fine', label: 'Fine' },
  { value: 'standard', label: 'Standard' },
  { value: 'coarse', label: 'Coarse' },
];

// Fine bins: indices 0-9
// Standard merges: [0,1]→0-1h  [2]→1-2h  [3]→2-4h  [4,5]→4-8h  [6,7]→8-16h  [8,9]→16h+
// Coarse merges:  [0,1,2,3]→0-4h  [4,5,6,7]→4-16h  [8,9]→16h+

type MergeSpec = { label: string; fineIndices: number[] };

const STANDARD_MERGE: MergeSpec[] = [
  { label: '0-1h', fineIndices: [0, 1] },
  { label: '1-2h', fineIndices: [2] },
  { label: '2-4h', fineIndices: [3] },
  { label: '4-8h', fineIndices: [4, 5] },
  { label: '8-16h', fineIndices: [6, 7] },
  { label: '16h+', fineIndices: [8, 9] },
];

const COARSE_MERGE: MergeSpec[] = [
  { label: '0-4h', fineIndices: [0, 1, 2, 3] },
  { label: '4-16h', fineIndices: [4, 5, 6, 7] },
  { label: '16h+', fineIndices: [8, 9] },
];

type ChartRow = {
  label: string;
  low: number;
  medium: number;
  high: number;
  urgent: number;
};

function mergeBins(data: HistogramRow[], spec: MergeSpec[]): ChartRow[] {
  return spec.map(({ label, fineIndices }) => {
    const merged: ChartRow = { label, low: 0, medium: 0, high: 0, urgent: 0 };
    for (const idx of fineIndices) {
      const bin = data[idx];
      if (bin) {
        merged.low += bin.low;
        merged.medium += bin.medium;
        merged.high += bin.high;
        merged.urgent += bin.urgent;
      }
    }
    return merged;
  });
}

export function ResolutionHistogramChart({ data }: { data: HistogramRow[] }) {
  const [granularity, setGranularity] = useState<Granularity>('standard');
  const colors = useChartTheme();

  const chartData = useMemo(() => {
    if (granularity === 'fine') {
      return data.map((bin) => ({
        label: bin.binLabel,
        low: bin.low,
        medium: bin.medium,
        high: bin.high,
        urgent: bin.urgent,
      }));
    }
    return mergeBins(data, granularity === 'standard' ? STANDARD_MERGE : COARSE_MERGE);
  }, [data, granularity]);

  const totalResolved = useMemo(
    () => data.reduce((s, b) => s + b.low + b.medium + b.high + b.urgent, 0),
    [data],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium">{formatCompact(totalResolved)}</span>
          <span className="text-caption">resolved tickets</span>
        </div>
        <ChartTabs value={granularity} onChange={setGranularity} options={GRAN_OPTIONS} />
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          accessibilityLayer={false}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: colors.axis }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: colors.axis }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip
            content={makeTooltip(colors)}
            cursor={{ fill: colors.created, fillOpacity: 0.12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="low" name="Low" stackId="a" fill={colors.low} />
          <Bar dataKey="medium" name="Medium" stackId="a" fill={colors.medium} />
          <Bar dataKey="high" name="High" stackId="a" fill={colors.high} />
          <Bar
            dataKey="urgent"
            name="Urgent"
            stackId="a"
            fill={colors.urgent}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-caption mt-2">
        Resolved tickets only, binned into fixed hour ranges.
      </p>
    </div>
  );
}
