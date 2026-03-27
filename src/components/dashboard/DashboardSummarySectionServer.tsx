import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { DashboardSummaryCards } from '@/components/dashboard/DashboardSummaryCards';
import { getDashboardSummaryWithComparison } from '@/lib/queries/dashboard';
import type { FilterState } from '@/types/filters';

export async function DashboardSummarySectionServer({ filters }: { filters: FilterState }) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['dashboard', 'summary', filters],
    queryFn: () => getDashboardSummaryWithComparison(filters),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardSummaryCards />
    </HydrationBoundary>
  );
}
