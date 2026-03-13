import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/Sidebar';
import { MotionMain } from '@/components/layout/MotionMain';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { getReferenceData } from '@/lib/actions/reference';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['reference', 'all'],
    queryFn: getReferenceData,
    staleTime: 60 * 60 * 1000,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex h-screen">
        <Sidebar />
        <MotionMain>{children}</MotionMain>
        <div className="fixed top-6 right-6 z-20">
          <ThemeToggle />
        </div>
      </div>
    </HydrationBoundary>
  );
}
