'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FilterBar } from '@/components/filters/FilterBar';
import { ResolutionComparisonChart } from '@/components/charts/ResolutionComparisonChart';
import { OverdueTicketsTable } from '@/components/dashboard/OverdueTicketsTable';
import { useFilterState } from '@/hooks/use-filter-state';
import { getResolutionTimeStats, getOverdueTickets } from '@/lib/queries/response-time';

const RT_FILTERS = ['date', 'teamMember'] as const;

function fmt(hours: number): string {
  return `${hours.toFixed(1)}h`;
}

function VarianceBadge({ actual, expected }: { actual: number; expected: number }) {
  const diff = actual - expected;
  const pct = expected > 0 ? ((diff / expected) * 100).toFixed(0) : '0';
  const over = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${
        over ? 'text-red-600' : 'text-green-600'
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

const PRIORITY_ORDER = ['low', 'medium', 'high', 'urgent'];

function Inner() {
  const { filters } = useFilterState();

  // Two separate queries — stats loads fast (~300ms), charts render immediately.
  // Overdue tickets (larger payload) loads after, table fills in progressively.
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['response-time', 'stats', filters],
    queryFn: () => getResolutionTimeStats(filters),
    staleTime: 30_000,
  });

  const { data: overdueData, isLoading: overdueLoading } = useQuery({
    queryKey: ['response-time', 'overdue', filters],
    queryFn: () => getOverdueTickets(filters, { page: 1, pageSize: 10000 }),
    staleTime: 30_000,
  });

  const sorted = [...(stats ?? [])].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority),
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Response Time Analysis</h1>
        <Suspense>
          <FilterBar allowedFilters={[...RT_FILTERS]} />
        </Suspense>
      </div>

      {/* ── Summary Stats Table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Resolution Time by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-[180px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Median</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead className="text-right">Expected</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No resolved tickets in the selected period
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((row) => (
                    <TableRow key={row.priority}>
                      <TableCell className="font-medium capitalize">{row.priority}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(row.minHours)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(row.medianHours)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(row.avgHours)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt(row.maxHours)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {fmt(row.expectedHours)}
                      </TableCell>
                      <TableCell className="text-right">
                        <VarianceBadge actual={row.avgHours} expected={row.expectedHours} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Comparison Chart ── */}
      <Card>
        <CardHeader>
          <CardTitle>Actual vs Expected Resolution Time</CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResolutionComparisonChart data={sorted} />
          )}
        </CardContent>
      </Card>

      {/* ── Overdue Tickets ── */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <OverdueTicketsTable
            rows={overdueData?.rows ?? []}
            isLoading={overdueLoading}
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
