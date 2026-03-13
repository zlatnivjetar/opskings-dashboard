import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { TeamContent } from '@/components/dashboard/TeamContent';
import { getTeamPerformance } from '@/lib/queries/team';

export default async function TeamPage() {
  const queryClient = new QueryClient();
  const emptyFilters = {};

  await queryClient.prefetchQuery({
    queryKey: ['team', 'performance', emptyFilters],
    queryFn: () => getTeamPerformance(emptyFilters),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeamContent />
    </HydrationBoundary>
  );
}
