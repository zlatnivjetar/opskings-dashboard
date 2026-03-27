import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ResponseTimeOverviewCards } from '@/components/dashboard/ResponseTimeOverviewCards';
import { getResponseTimeOverview } from '@/lib/queries/response-time';
import type { FilterState } from '@/types/filters';

export async function ResponseTimeOverviewSectionServer({
  filters,
}: {
  filters: FilterState;
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['response-time', 'overview', filters],
    queryFn: () => getResponseTimeOverview(filters),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResponseTimeOverviewCards />
    </HydrationBoundary>
  );
}
