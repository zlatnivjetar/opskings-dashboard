import { Suspense } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ResponseTimeDetailsSectionServer } from '@/components/dashboard/ResponseTimeDetailsSectionServer';
import { ResponseTimeOverdueSectionServer } from '@/components/dashboard/ResponseTimeOverdueSectionServer';
import { ResponseTimeOverviewSectionServer } from '@/components/dashboard/ResponseTimeOverviewSectionServer';
import {
  ResponseTimeDetailsSkeleton,
  SummaryCardsSkeleton,
  TableCardSkeleton,
} from '@/components/skeletons/analytics';
import {
  parsePageParam,
  RESPONSE_TIME_OVERDUE_PAGE_PARAM,
} from '@/lib/dashboard-route-state';
import { getFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/filter-url-state';

const RESPONSE_TIME_FILTERS = ['date', 'teamMember'] as const;

export default async function ResponseTimePage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = await getFiltersFromPageSearchParams(resolvedSearchParams);
  const overduePage = parsePageParam(resolvedSearchParams, RESPONSE_TIME_OVERDUE_PAGE_PARAM, 1);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Response Time Analysis"
        allowedFilters={[...RESPONSE_TIME_FILTERS]}
        clearKeysOnChange={[RESPONSE_TIME_OVERDUE_PAGE_PARAM]}
        navigationMode="route"
      />

      <Suspense fallback={<SummaryCardsSkeleton />}>
        <ResponseTimeOverviewSectionServer filters={filters} />
      </Suspense>

      <Suspense fallback={<ResponseTimeDetailsSkeleton />}>
        <ResponseTimeDetailsSectionServer filters={filters} />
      </Suspense>

      <Suspense fallback={<TableCardSkeleton rows={10} titleWidth="12rem" />}>
        <ResponseTimeOverdueSectionServer filters={filters} page={overduePage} />
      </Suspense>
    </div>
  );
}
