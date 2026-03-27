'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilterState } from '@/hooks/use-filter-state';
import { serializeFilters } from '@/lib/api/filter-state';
import { fetchJson } from '@/lib/fetch-json';
import type { DashboardDistributions } from '@/lib/queries/dashboard';

const TicketsByTypeChart = dynamic(
  () =>
    import('@/components/charts/TicketsByTypeChart').then((module) => ({
      default: module.TicketsByTypeChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-full" />,
  },
);

const TicketsByPriorityChart = dynamic(
  () =>
    import('@/components/charts/TicketsByPriorityChart').then((module) => ({
      default: module.TicketsByPriorityChart,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] w-full" />,
  },
);

export function DashboardDistributionsSection() {
  const { filters } = useFilterState();
  const filterParam = useMemo(() => serializeFilters(filters), [filters]);

  const distributionsQuery = useQuery({
    queryKey: ['dashboard', 'distributions', filters],
    queryFn: () =>
      fetchJson<DashboardDistributions>(`/api/dashboard/distributions?filters=${filterParam}`),
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });

  return (
    <>
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Tickets by Type</CardTitle>
        </CardHeader>
        <CardContent>
          {distributionsQuery.data ? (
            <TicketsByTypeChart data={distributionsQuery.data.byType} />
          ) : (
            <Skeleton className="h-[300px] w-full" />
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Tickets by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          {distributionsQuery.data ? (
            <TicketsByPriorityChart data={distributionsQuery.data.byPriority} />
          ) : (
            <Skeleton className="h-[200px] w-full" />
          )}
        </CardContent>
      </Card>
    </>
  );
}
