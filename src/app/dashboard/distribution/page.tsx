'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/filters/FilterBar';
import { TicketsByTypeChart } from '@/components/charts/TicketsByTypeChart';
import { TicketsByPriorityChart } from '@/components/charts/TicketsByPriorityChart';
import { useFilterState } from '@/hooks/use-filter-state';
import { getTicketsByType, getTicketsByPriority } from '@/lib/queries/dashboard';

const DIST_FILTERS = ['date', 'teamMember'] as const;

function Inner() {
  const { filters } = useFilterState();

  const { data: typeData = [], isLoading: typeLoading } = useQuery({
    queryKey: ['dashboard', 'ticketsByType', filters],
    queryFn: () => getTicketsByType(filters),
    staleTime: 30_000,
  });

  const { data: priorityData = [], isLoading: priorityLoading } = useQuery({
    queryKey: ['dashboard', 'ticketsByPriority', filters],
    queryFn: () => getTicketsByPriority(filters),
    staleTime: 30_000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Distribution</h1>
        <Suspense>
          <FilterBar allowedFilters={[...DIST_FILTERS]} />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeLoading ? (
              <Skeleton className="h-[340px] w-full" />
            ) : (
              <TicketsByTypeChart data={typeData} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityLoading ? (
              <Skeleton className="h-[340px] w-full" />
            ) : (
              <TicketsByPriorityChart data={priorityData} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DistributionPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
