'use client';

import { Suspense, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/filters/FilterBar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TicketsOverTimeChart } from '@/components/charts/TicketsOverTimeChart';
import { TicketsByTypeChart } from '@/components/charts/TicketsByTypeChart';
import { TicketsByPriorityChart } from '@/components/charts/TicketsByPriorityChart';
import { useFilterState } from '@/hooks/use-filter-state';
import { formatCompact, formatHours } from '@/lib/format';
import { serializeFilters } from '@/lib/api/filter-state';
import type {
  DashboardAllWithComparison,
} from '@/lib/queries/dashboard';

function computeTrend(
  current: number,
  previous: number | undefined | null,
): { value: number; label: string } | undefined {
  if (previous == null || previous === 0) return undefined;
  return {
    value: ((current - previous) / previous) * 100,
    label: 'vs prev period',
  };
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2 p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
      <Card className="lg:col-span-1 p-4">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    </div>
  );
}

function ChartsRow({
  data,
  isLoading,
}: {
  data: DashboardAllWithComparison | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <ChartsSkeleton />;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tickets Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsOverTimeChart data={data?.ticketsOverTime ?? []} />
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Tickets by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsByTypeChart data={data?.byType ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function Inner() {
  const { filters } = useFilterState();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', 'all', filters],
    queryFn: () => getJson<DashboardAllWithComparison>(`/api/dashboard/all?filters=${filterParam}`),
    staleTime: 30_000,
  });

  const summary = dashboardQuery.data?.summary;
  const previous = dashboardQuery.data?.previousSummary;

  const openPct =
    summary && summary.totalTickets > 0
      ? `${((summary.openTickets / summary.totalTickets) * 100).toFixed(1)}% not resolved`
      : '0% not resolved';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-page-title mb-4">Dashboard</h1>
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="TOTAL TICKETS"
          value={summary ? formatCompact(summary.totalTickets) : '—'}
          subtitle="All tickets in period"
          trend={summary ? computeTrend(summary.totalTickets, previous?.totalTickets) : undefined}
          delay={0}
        />
        <KpiCard
          label="OPEN TICKETS"
          value={summary ? formatCompact(summary.openTickets) : '—'}
          subtitle={openPct}
          trend={summary ? computeTrend(summary.openTickets, previous?.openTickets) : undefined}
          positiveIsGood={false}
          delay={0.05}
        />
        <KpiCard
          label="AVG RESOLUTION TIME"
          value={summary?.avgResolutionHours != null ? formatHours(summary.avgResolutionHours) : '—'}
          subtitle="Resolved tickets only"
          trend={
            summary?.avgResolutionHours != null && previous?.avgResolutionHours != null
              ? computeTrend(summary.avgResolutionHours, previous.avgResolutionHours)
              : undefined
          }
          positiveIsGood={false}
          delay={0.1}
        />
        <KpiCard
          label="CUSTOMER SATISFACTION"
          value={summary?.avgRating != null ? `${summary.avgRating.toFixed(1)} / 5` : '—'}
          subtitle={
            summary?.avgRating != null
              ? '★'.repeat(Math.round(summary.avgRating)) +
                '☆'.repeat(5 - Math.round(summary.avgRating))
              : undefined
          }
          trend={
            summary?.avgRating != null && previous?.avgRating != null
              ? computeTrend(summary.avgRating, previous.avgRating)
              : undefined
          }
          delay={0.15}
        />
      </div>

      <ChartsRow
        data={dashboardQuery.data}
        isLoading={dashboardQuery.isLoading}
      />

      <Card>
        <CardHeader>
          <CardTitle>Tickets by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardQuery.isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <TicketsByPriorityChart data={dashboardQuery.data?.byPriority ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardContent() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
