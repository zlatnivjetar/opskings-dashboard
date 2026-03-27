'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFilterState } from '@/hooks/use-filter-state';
import { serializeFilters } from '@/lib/api/filter-state';
import { fetchJson } from '@/lib/fetch-json';
import { formatCompact } from '@/lib/format';
import type {
  OverdueByPriorityRow,
  ResolutionStatRow,
  ResponseTimeOverview,
} from '@/lib/queries/response-time';

const ResolutionHistogramChart = dynamic(
  () =>
    import('@/components/charts/ResolutionHistogramChart').then((module) => ({
      default: module.ResolutionHistogramChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  },
);

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];

function formatDuration(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

function VarianceBadge({ actual, expected }: { actual: number; expected: number }) {
  const diff = actual - expected;
  const pct = expected > 0 ? ((diff / expected) * 100).toFixed(0) : '0';
  const isOver = diff > 0;

  return (
    <span className={`inline-flex items-center gap-1 font-bold ${!isOver ? 'text-success' : ''}`}>
      {isOver ? '+' : ''}
      {formatDuration(diff)}{' '}
      <span className="text-xs font-normal opacity-70">
        ({isOver ? '+' : ''}
        {pct}%)
      </span>
    </span>
  );
}

export function ResponseTimeDetailsSection() {
  const { filters } = useFilterState();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);

  const overviewQuery = useQuery({
    queryKey: ['response-time', 'overview', filters],
    queryFn: () =>
      fetchJson<ResponseTimeOverview>(`/api/response-time/overview?filters=${filterParam}`),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const detailsQuery = useQuery({
    queryKey: ['response-time', 'details', filters],
    queryFn: () =>
      fetchJson<{ stats: ResolutionStatRow[]; overdueByPriority: OverdueByPriorityRow[] }>(
        `/api/response-time/details?filters=${filterParam}`,
      ),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const sorted = useMemo(
    () =>
      [...(detailsQuery.data?.stats ?? [])].sort(
        (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
      ),
    [detailsQuery.data?.stats],
  );

  const resolvedByPriority = useMemo(() => {
    const result: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };

    for (const bin of overviewQuery.data?.histogram ?? []) {
      result.low += bin.low;
      result.medium += bin.medium;
      result.high += bin.high;
      result.urgent += bin.urgent;
    }

    return result;
  }, [overviewQuery.data?.histogram]);

  const overdueByPriority = useMemo(() => {
    const result: Record<string, number> = { low: 0, medium: 0, high: 0, urgent: 0 };

    for (const row of detailsQuery.data?.overdueByPriority ?? []) {
      result[row.priority] = row.overdueCount;
    }

    return result;
  }, [detailsQuery.data?.overdueByPriority]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Resolution Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {overviewQuery.data ? (
            <ResolutionHistogramChart data={overviewQuery.data.histogram} />
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary by Priority</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {detailsQuery.data ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Priority</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="text-right">Median</TableHead>
                  <TableHead className="pr-6 text-right">Delta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-6 pl-6 text-center text-muted-foreground">
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((row) => {
                    const resolved = resolvedByPriority[row.priority] ?? 0;
                    const overdueCount = overdueByPriority[row.priority] ?? 0;
                    const percentLabel =
                      resolved > 0 ? ` (${((overdueCount / resolved) * 100).toFixed(0)}%)` : '';

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
                            ? `${formatCompact(overdueCount)}${percentLabel}`
                            : '--'}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatDuration(row.medianHours)}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <VarianceBadge actual={row.avgHours} expected={row.expectedHours} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            <Skeleton className="mx-6 h-[280px] w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
