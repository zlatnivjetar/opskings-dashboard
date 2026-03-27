import { Suspense } from 'react';
import { DashboardDistributionsSectionServer } from '@/components/dashboard/DashboardDistributionsSectionServer';
import { DashboardSummarySectionServer } from '@/components/dashboard/DashboardSummarySectionServer';
import { DashboardTicketsOverTimeSectionServer } from '@/components/dashboard/DashboardTicketsOverTimeSectionServer';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  ChartCardSkeleton,
  SummaryCardsSkeleton,
} from '@/components/skeletons/analytics';
import { getFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/filter-url-state';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const filters = await getFiltersFromPageSearchParams(searchParams);

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Dashboard" />

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <DashboardSummarySectionServer filters={filters} />
      </Suspense>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Suspense
          fallback={
            <div className="lg:col-span-2">
              <ChartCardSkeleton height={300} />
            </div>
          }
        >
          <DashboardTicketsOverTimeSectionServer filters={filters} />
        </Suspense>

        <Suspense
          fallback={
            <>
              <div className="lg:col-span-1">
                <ChartCardSkeleton height={300} />
              </div>
              <div className="lg:col-span-2">
                <ChartCardSkeleton height={220} />
              </div>
            </>
          }
        >
          <DashboardDistributionsSectionServer filters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
