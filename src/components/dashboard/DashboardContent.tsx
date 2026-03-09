'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/filters/FilterBar';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { TicketsOverTimeChart } from '@/components/charts/TicketsOverTimeChart';
import { useFilterState } from '@/hooks/use-filter-state';
import { getDashboardAllWithComparison } from '@/lib/queries/dashboard';
import { formatCompact, formatHours } from '@/lib/format';
import type { DashboardSummary, TicketsOverTimeRow } from '@/lib/queries/dashboard';

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

function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-28" />
        </Card>
      ))}
    </div>
  );
}

function KpiCards({
  summary,
  previous,
}: {
  summary: DashboardSummary | undefined;
  previous: DashboardSummary | null | undefined;
}) {
  if (!summary) return <KpiCardsSkeleton />;

  const openPct =
    summary.totalTickets > 0
      ? `${((summary.openTickets / summary.totalTickets) * 100).toFixed(1)}% not resolved`
      : '0% not resolved';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="TOTAL TICKETS"
        value={formatCompact(summary.totalTickets)}
        subtitle="All tickets in period"
        trend={computeTrend(summary.totalTickets, previous?.totalTickets)}
      />
      <KpiCard
        label="OPEN TICKETS"
        value={formatCompact(summary.openTickets)}
        subtitle={openPct}
        trend={computeTrend(summary.openTickets, previous?.openTickets)}
        positiveIsGood={false}
      />
      <KpiCard
        label="AVG RESOLUTION TIME"
        value={summary.avgResolutionHours != null ? formatHours(summary.avgResolutionHours) : '—'}
        subtitle="Resolved tickets only"
        trend={
          summary.avgResolutionHours != null && previous?.avgResolutionHours != null
            ? computeTrend(summary.avgResolutionHours, previous.avgResolutionHours)
            : undefined
        }
        positiveIsGood={false}
      />
      <KpiCard
        label="CUSTOMER SATISFACTION"
        value={summary.avgRating != null ? `${summary.avgRating.toFixed(1)} / 5` : '—'}
        subtitle={
          summary.avgRating != null
            ? '★'.repeat(Math.round(summary.avgRating)) +
              '☆'.repeat(5 - Math.round(summary.avgRating))
            : undefined
        }
        trend={
          summary.avgRating != null && previous?.avgRating != null
            ? computeTrend(summary.avgRating, previous.avgRating)
            : undefined
        }
      />
    </div>
  );
}

function TicketsChart({
  data,
  isLoading,
}: {
  data: TicketsOverTimeRow[] | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <Skeleton className="h-[300px] w-full" />;
  return <TicketsOverTimeChart data={data ?? []} />;
}

function Inner() {
  const { filters } = useFilterState();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'all-with-comparison', filters],
    queryFn: () => getDashboardAllWithComparison(filters),
    staleTime: 30_000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-page-title mb-4">Dashboard</h1>
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      <KpiCards summary={data?.summary} previous={data?.previousSummary} />

      <Card>
        <CardHeader>
          <CardTitle>Tickets Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsChart data={data?.ticketsOverTime} isLoading={isLoading} />
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
