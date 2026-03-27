import { Suspense } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { TeamLeaderboardSectionServer } from '@/components/dashboard/TeamLeaderboardSectionServer';
import { TeamPerformanceTableSectionServer } from '@/components/dashboard/TeamPerformanceTableSectionServer';
import { TeamSummarySectionServer } from '@/components/dashboard/TeamSummarySectionServer';
import {
  ChartCardSkeleton,
  CompactSummarySkeleton,
  TableCardSkeleton,
} from '@/components/skeletons/analytics';
import { parseTeamTableState, TEAM_TABLE_PAGE_PARAM } from '@/lib/dashboard-route-state';
import { getFiltersFromPageSearchParams, type PageSearchParams } from '@/lib/filter-url-state';

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const filters = await getFiltersFromPageSearchParams(resolvedSearchParams);
  const tableState = parseTeamTableState(resolvedSearchParams);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Team Performance"
        clearKeysOnChange={[TEAM_TABLE_PAGE_PARAM]}
        navigationMode="route"
      />

      <Suspense fallback={<CompactSummarySkeleton items={4} />}>
        <TeamSummarySectionServer filters={filters} />
      </Suspense>

      <Suspense fallback={<TableCardSkeleton rows={10} titleWidth="12rem" />}>
        <TeamPerformanceTableSectionServer filters={filters} tableState={tableState} />
      </Suspense>

      <Suspense fallback={<ChartCardSkeleton height={260} />}>
        <TeamLeaderboardSectionServer filters={filters} />
      </Suspense>
    </div>
  );
}
