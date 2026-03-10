'use client';

import { Suspense, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge } from '@/components/ui/priority-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FilterBar } from '@/components/filters/FilterBar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ResolutionHistogramChart } from '@/components/charts/ResolutionHistogramChart';
import { OverdueTicketsTable } from '@/components/dashboard/OverdueTicketsTable';
import { useFilterState } from '@/hooks/use-filter-state';
import { getResponseTimeAll } from '@/lib/queries/response-time';
import { formatCompact, formatHours } from '@/lib/format';

const RT_FILTERS = ['date', 'teamMember'] as const;
const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];

function fmt(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

function VarianceBadge({ actual, expected }: { actual: number; expected: number }) {
  const diff = actual - expected;
  const pct = expected > 0 ? ((diff / expected) * 100).toFixed(0) : '0';
  const over = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold ${
        !over ? 'text-success' : ''
      }`}
    >
      {over ? '+' : ''}
      {fmt(diff)}{' '}
      <span className="text-xs font-normal opacity-70">
        ({over ? '+' : ''}
        {pct}%)
      </span>
    </span>
  );
}

function Inner() {
  const { filters } = useFilterState();

  const { data, isLoading } = useQuery({
    queryKey: ['response-time', 'all', filters],
    queryFn: () => getResponseTimeAll(filters),
    staleTime: 30_000,
  });

  const sorted = useMemo(
    () =>
      [...(data?.stats ?? [])].sort(
        (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
      ),
    [data?.stats],
  );

  // Resolved count per priority — derived from histogram (sum all bins)
  const resolvedByPriority = useMemo(() => {
    const result: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };
    for (const bin of data?.histogram ?? []) {
      result.low += bin.low;
      result.medium += bin.medium;
      result.high += bin.high;
      result.urgent += bin.urgent;
    }
    return result;
  }, [data?.histogram]);

  // Overdue count per priority — derived from overdue rows
  const overdueByPriority = useMemo(() => {
    const result: Record<string, number> = {};
    for (const row of data?.overdue.rows ?? []) {
      result[row.priority] = (result[row.priority] ?? 0) + 1;
    }
    return result;
  }, [data?.overdue.rows]);

  const { summary, overdue } = data ?? {};
  const overduePct =
    summary && summary.resolvedCount > 0 && overdue
      ? `${((overdue.totalCount / summary.resolvedCount) * 100).toFixed(1)}% of resolved`
      : undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-page-title mb-4">Response Time Analysis</h1>
        <Suspense>
          <FilterBar allowedFilters={[...RT_FILTERS]} />
        </Suspense>
      </div>

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-28" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="RESOLVED TICKETS"
            value={summary ? formatCompact(summary.resolvedCount) : '—'}
            subtitle="In selected period"
          />
          <KpiCard
            label="MEDIAN RESOLUTION"
            value={summary?.medianHours != null ? formatHours(summary.medianHours) : '—'}
            subtitle="50th percentile"
            positiveIsGood={false}
          />
          <KpiCard
            label="AVG RESOLUTION TIME"
            value={summary?.avgHours != null ? formatHours(summary.avgHours) : '—'}
            subtitle="Resolved tickets only"
            positiveIsGood={false}
          />
          <KpiCard
            label="OVERDUE TICKETS"
            value={overdue ? formatCompact(overdue.totalCount) : '—'}
            subtitle={overduePct}
            positiveIsGood={false}
          />
        </div>
      )}

      {/* ── Two-column: Histogram + Summary Table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resolution Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResolutionHistogramChart data={data?.histogram ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary by Priority</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {isLoading ? (
              <Skeleton className="h-[280px] w-full mx-6" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Priority</TableHead>
                    <TableHead className="text-right">Resolved</TableHead>
                    <TableHead className="text-right">Overdue</TableHead>
                    <TableHead className="text-right">Median</TableHead>
                    <TableHead className="text-right pr-6">Δ Exp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground pl-6">
                        No data
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((row) => {
                      const resolved = resolvedByPriority[row.priority] ?? 0;
                      const overdueCount = overdueByPriority[row.priority] ?? 0;
                      const pctStr =
                        resolved > 0
                          ? ` (${((overdueCount / resolved) * 100).toFixed(0)}%)`
                          : '';
                      return (
                        <TableRow key={row.priority}>
                          <TableCell className="pl-6">
                            <PriorityBadge priority={row.priority} />
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCompact(resolved)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold">
                            {overdueCount > 0
                              ? `${formatCompact(overdueCount)}${pctStr}`
                              : '—'}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {fmt(row.medianHours)}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <VarianceBadge actual={row.avgHours} expected={row.expectedHours} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Overdue Tickets ── */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Tickets</CardTitle>
          <p className="text-caption">
            Resolved tickets where actual resolution time exceeded the expected hours for the ticket
            type.
          </p>
        </CardHeader>
        <CardContent>
          <OverdueTicketsTable rows={data?.overdue.rows ?? []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ResponseTimeContent() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
