import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { ClientAnalysisTable } from '@/components/dashboard/ClientAnalysisTable';
import { getClientAnalysis } from '@/lib/queries/clients';

export default async function ClientsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['clients', 'analysis', 'all'],
    queryFn: () => getClientAnalysis({ page: 1, pageSize: 1000 }),
    staleTime: 30_000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Client Analysis</h1>
        <ClientAnalysisTable />
      </div>
    </HydrationBoundary>
  );
}
