import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ResponseTimeDetailsSection } from '@/components/dashboard/ResponseTimeDetailsSection';
import { getOverdueByPriority, getResolutionTimeStats, getResponseTimeOverview } from '@/lib/queries/response-time';
import type { FilterState } from '@/types/filters';

export async function ResponseTimeDetailsSectionServer({
  filters,
}: {
  filters: FilterState;
}) {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['response-time', 'overview', filters],
      queryFn: () => getResponseTimeOverview(filters),
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['response-time', 'details', filters],
      queryFn: async () => {
        const [stats, overdueByPriority] = await Promise.all([
          getResolutionTimeStats(filters),
          getOverdueByPriority(filters),
        ]);

        return { stats, overdueByPriority };
      },
      staleTime: 30_000,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResponseTimeDetailsSection />
    </HydrationBoundary>
  );
}
