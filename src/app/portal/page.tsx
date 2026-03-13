import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { PortalContent } from '@/components/portal/PortalContent';
import { getMyTickets } from '@/lib/queries/portal';

export default async function PortalPage() {
  const queryClient = new QueryClient();
  const defaultFilters = {};
  const page = 1;
  const pageSize = 20;

  await queryClient.prefetchQuery({
    queryKey: ['portal', 'tickets', defaultFilters, page],
    queryFn: () => getMyTickets({ page, pageSize, filters: defaultFilters }),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PortalContent />
    </HydrationBoundary>
  );
}
