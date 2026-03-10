'use client';

import { useState, useMemo } from 'react';
import { useChartTheme, priorityColor } from '@/hooks/use-chart-theme';
import { ChartTabs } from '@/components/charts/ChartTabs';
import { formatCompact } from '@/lib/format';
import type { TicketsByPriorityRow } from '@/lib/queries/dashboard';

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const PRIORITY_ORDER = ['urgent', 'high', 'medium', 'low'];

function getCount(row: TicketsByPriorityRow, filter: StatusFilter): number {
  if (filter === 'all') return row.open + row.in_progress + row.resolved;
  return row[filter];
}

export function TicketsByPriorityChart({ data }: { data: TicketsByPriorityRow[] }) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const colors = useChartTheme();

  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
      ),
    [data],
  );

  const rows = useMemo(
    () =>
      sorted.map((row) => ({
        priority: row.priority,
        count: getCount(row, filter),
        color: priorityColor(colors, row.priority),
      })),
    [sorted, filter, colors],
  );

  const grandTotal = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-card-value">{formatCompact(grandTotal)}</span>
          <span className="text-caption">tickets</span>
        </div>
        <ChartTabs value={filter} onChange={setFilter} options={STATUS_OPTIONS} />
      </div>

      {/* Stacked horizontal bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-muted mb-6">
        {rows.map(
          (row) =>
            row.count > 0 && (
              <div
                key={row.priority}
                className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${grandTotal > 0 ? (row.count / grandTotal) * 100 : 0}%`,
                  backgroundColor: row.color,
                }}
                title={`${row.priority}: ${row.count.toLocaleString()}`}
              />
            ),
        )}
      </div>

      {/* Breakdown list */}
      <div className="space-y-3">
        {rows.map((row) => {
          const pct = grandTotal > 0 ? (row.count / grandTotal) * 100 : 0;
          return (
            <div key={row.priority} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: row.color }}
                />
                <span className="text-sm font-medium capitalize">{row.priority}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium tabular-nums">
                  {row.count.toLocaleString()}
                </span>
                <span className="text-caption w-14 text-right tabular-nums">
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
