import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ResponseTimeContent } from '@/components/dashboard/ResponseTimeContent';
import { getOverdueByPriority, getResolutionTimeStats, getResponseTimeOverview } from '@/lib/queries/response-time';

export default async function ResponseTimePage() {
  const queryClient = new QueryClient();
  const emptyFilters = {};

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['response-time', 'overview', emptyFilters],
      queryFn: () => getResponseTimeOverview(emptyFilters),
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['response-time', 'details', emptyFilters],
      queryFn: async () => {
        const [stats, overdueByPriority] = await Promise.all([
          getResolutionTimeStats(emptyFilters),
          getOverdueByPriority(emptyFilters),
        ]);
        return { stats, overdueByPriority };
      },
      staleTime: 30_000,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResponseTimeContent />
    </HydrationBoundary>
  );
}
