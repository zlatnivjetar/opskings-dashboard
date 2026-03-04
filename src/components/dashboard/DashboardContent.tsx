'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/filters/FilterBar';
import { TicketsOverTimeChart } from '@/components/charts/TicketsOverTimeChart';
import { useFilterState } from '@/hooks/use-filter-state';
import { getDashboardSummary, getTicketsOverTime } from '@/lib/queries/dashboard';
import type { FilterState } from '@/types/filters';

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SummaryCards({ filters }: { filters: FilterState }) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'summary', filters],
    queryFn: () => getDashboardSummary(filters),
    staleTime: 30_000,
  });

  if (isLoading || !data) return <SummaryCardsSkeleton />;

  const openPct =
    data.totalTickets > 0
      ? ((data.openTickets / data.totalTickets) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalTickets.toLocaleString('en-US')}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.openTickets.toLocaleString('en-US')}</div>
          <p className="text-xs text-muted-foreground mt-1">{openPct}% of total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg Resolution Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.avgResolutionHours != null ? `${data.avgResolutionHours.toFixed(1)} hrs` : '—'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Customer Satisfaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.avgRating != null ? `${data.avgRating.toFixed(1)} / 5` : '—'}
          </div>
          {data.avgRating != null && (
            <div className="flex gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={
                    star <= Math.round(data.avgRating!)
                      ? 'text-yellow-400 text-sm'
                      : 'text-muted-foreground text-sm'
                  }
                >
                  ★
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TicketsChart({ filters }: { filters: FilterState }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['dashboard', 'ticketsOverTime', filters],
    queryFn: () => getTicketsOverTime(filters),
    staleTime: 30_000,
  });

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;

  return <TicketsOverTimeChart data={data} />;
}

function Inner() {
  const { filters } = useFilterState();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
        <Suspense>
          <FilterBar />
        </Suspense>
      </div>

      <SummaryCards filters={filters} />

      <Card>
        <CardHeader>
          <CardTitle>Tickets Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketsChart filters={filters} />
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
