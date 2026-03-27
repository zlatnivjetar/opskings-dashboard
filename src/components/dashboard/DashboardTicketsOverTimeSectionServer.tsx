import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { DashboardTicketsOverTimeCard } from '@/components/dashboard/DashboardTicketsOverTimeCard';
import { getTicketsOverTime } from '@/lib/queries/dashboard';
import type { FilterState } from '@/types/filters';

export async function DashboardTicketsOverTimeSectionServer({
  filters,
}: {
  filters: FilterState;
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['dashboard', 'tickets-over-time', filters],
    queryFn: () => getTicketsOverTime(filters),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardTicketsOverTimeCard />
    </HydrationBoundary>
  );
}
