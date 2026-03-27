import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { DashboardDistributionsSection } from '@/components/dashboard/DashboardDistributionsSection';
import { getDashboardDistributions } from '@/lib/queries/dashboard';
import type { FilterState } from '@/types/filters';

export async function DashboardDistributionsSectionServer({ filters }: { filters: FilterState }) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['dashboard', 'distributions', filters],
    queryFn: () => getDashboardDistributions(filters),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardDistributionsSection />
    </HydrationBoundary>
  );
}
