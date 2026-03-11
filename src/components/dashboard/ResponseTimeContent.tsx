'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { formatCompact, formatHours } from '@/lib/format';
import { serializeFilters } from '@/lib/api/filter-state';
import type {
  OverdueByPriorityRow,
  OverdueTicketsResult,
  ResponseTimeOverview,
  ResolutionStatRow,
} from '@/lib/queries/response-time';

const RT_FILTERS = ['date', 'teamMember'] as const;
const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];
const PAGE_SIZE = 20;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function fmt(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

function VarianceBadge({ actual, expected }: { actual: number; expected: number }) {
  const diff = actual - expected;
  const pct = expected > 0 ? ((diff / expected) * 100).toFixed(0) : '0';
  const over = diff > 0;
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${!over ? 'text-success' : ''}`}>
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
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);
  const offset = (page - 1) * PAGE_SIZE;

  const overviewQuery = useQuery({
    queryKey: ['response-time', 'overview', filters],
    queryFn: () => getJson<ResponseTimeOverview>(`/api/response-time/overview?filters=${filterParam}`),
    staleTime: 30_000,
  });

  const statsQuery = useQuery({
    queryKey: ['response-time', 'stats', filters],
    queryFn: () => getJson<ResolutionStatRow[]>(`/api/response-time/stats?filters=${filterParam}`),
    staleTime: 30_000,
  });

  const overdueQuery = useQuery({
    queryKey: ['response-time', 'overdue', filters, page],
    queryFn: () =>
      getJson<OverdueTicketsResult>(
        `/api/response-time/overdue?filters=${filterParam}&limit=${PAGE_SIZE}&offset=${offset}`,
      ),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  const overdueByPriorityQuery = useQuery({
    queryKey: ['response-time', 'overdue-by-priority', filters],
    queryFn: () =>
      getJson<OverdueByPriorityRow[]>(`/api/response-time/overdue-by-priority?filters=${filterParam}`),
    staleTime: 30_000,
  });


  useEffect(() => {
    if (page !== 1 || !overdueQuery.data || overdueQuery.data.totalPages < 2) {
      return;
    }

    const nextPage = 2;
    const nextOffset = (nextPage - 1) * PAGE_SIZE;

    void queryClient.prefetchQuery({
      queryKey: ['response-time', 'overdue', filters, nextPage],
      queryFn: () =>
        getJson<OverdueTicketsResult>(
          `/api/response-time/overdue?filters=${filterParam}&limit=${PAGE_SIZE}&offset=${nextOffset}`,
        ),
      staleTime: 30_000,
    });
  }, [queryClient, page, overdueQuery.data, filters, filterParam]);

  const sorted = useMemo(
    () =>
      [...(statsQuery.data ?? [])].sort(
        (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
      ),
    [statsQuery.data],
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
    for (const row of overdueByPriorityQuery.data ?? []) {
      result[row.priority] = row.overdueCount;
    }
    return result;
  }, [overdueByPriorityQuery.data]);

  const overduePct =
    overviewQuery.data && overviewQuery.data.summary.resolvedCount > 0 && overdueQuery.data
      ? `${((overdueQuery.data.totalCount / overviewQuery.data.summary.resolvedCount) * 100).toFixed(1)}% of resolved`
      : undefined;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-page-title mb-4">Response Time Analysis</h1>
        <Suspense>
          <FilterBar allowedFilters={[...RT_FILTERS]} />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="RESOLVED TICKETS"
          value={overviewQuery.data ? formatCompact(overviewQuery.data.summary.resolvedCount) : '—'}
          subtitle="In selected period"
        />
        <KpiCard
          label="MEDIAN RESOLUTION"
          value={
            overviewQuery.data?.summary.medianHours != null
              ? formatHours(overviewQuery.data.summary.medianHours)
              : '—'
          }
          subtitle="50th percentile"
          positiveIsGood={false}
        />
        <KpiCard
          label="AVG RESOLUTION TIME"
          value={
            overviewQuery.data?.summary.avgHours != null
              ? formatHours(overviewQuery.data.summary.avgHours)
              : '—'
          }
          subtitle="Resolved tickets only"
          positiveIsGood={false}
        />
        <KpiCard
          label="OVERDUE TICKETS"
          value={overdueQuery.data ? formatCompact(overdueQuery.data.totalCount) : '—'}
          subtitle={overduePct}
          positiveIsGood={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resolution Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {overviewQuery.isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResolutionHistogramChart data={overviewQuery.data?.histogram ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary by Priority</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {statsQuery.isLoading ? (
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
                      const pctStr = resolved > 0 ? ` (${((overdueCount / resolved) * 100).toFixed(0)}%)` : '';
                      return (
                        <TableRow key={row.priority}>
                          <TableCell className="pl-6">
                            <PriorityBadge priority={row.priority} />
                          </TableCell>
                          <TableCell className="text-right text-sm">{formatCompact(resolved)}</TableCell>
                          <TableCell className="text-right text-sm font-bold">
                            {overdueCount > 0 ? `${formatCompact(overdueCount)}${pctStr}` : '—'}
                          </TableCell>
                          <TableCell className="text-right text-sm">{fmt(row.medianHours)}</TableCell>
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

      <Card>
        <CardHeader>
          <CardTitle>Overdue Tickets</CardTitle>
          <p className="text-caption">
            Resolved tickets where actual resolution time exceeded the expected hours for the ticket
            type.
          </p>
        </CardHeader>
        <CardContent>
          <OverdueTicketsTable
            rows={overdueQuery.data?.rows ?? []}
            totalCount={overdueQuery.data?.totalCount ?? 0}
            totalPages={overdueQuery.data?.totalPages ?? 1}
            page={page}
            onPageChange={setPage}
            isLoading={overdueQuery.isLoading}
            isFetching={overdueQuery.isFetching}
          />
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
