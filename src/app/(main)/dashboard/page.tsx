import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import {
  getDashboardDistributions,
  getDashboardSummaryWithComparison,
  getTicketsOverTime,
} from '@/lib/queries/dashboard';

export default async function DashboardPage() {
  const queryClient = new QueryClient();
  const emptyFilters = {};

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'summary', emptyFilters],
      queryFn: () => getDashboardSummaryWithComparison(emptyFilters),
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'tickets-over-time', emptyFilters],
      queryFn: () => getTicketsOverTime(emptyFilters),
      staleTime: 30_000,
    }),
    queryClient.prefetchQuery({
      queryKey: ['dashboard', 'distributions', emptyFilters],
      queryFn: () => getDashboardDistributions(emptyFilters),
      staleTime: 30_000,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
