'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilterState } from '@/hooks/use-filter-state';
import { serializeFilters } from '@/lib/api/filter-state';
import { fetchJson } from '@/lib/fetch-json';
import type { TicketsOverTimeRow } from '@/lib/queries/dashboard';

const TicketsOverTimeChart = dynamic(
  () =>
    import('@/components/charts/TicketsOverTimeChart').then((module) => ({
      default: module.TicketsOverTimeChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  },
);

export function DashboardTicketsOverTimeCard() {
  const { filters } = useFilterState();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);

  const timeQuery = useQuery({
    queryKey: ['dashboard', 'tickets-over-time', filters],
    queryFn: () =>
      fetchJson<TicketsOverTimeRow[]>(`/api/dashboard/tickets-over-time?filters=${filterParam}`),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Tickets Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {timeQuery.data ? (
          <TicketsOverTimeChart data={timeQuery.data} />
        ) : (
          <Skeleton className="h-[300px] w-full" />
        )}
      </CardContent>
    </Card>
  );
}
