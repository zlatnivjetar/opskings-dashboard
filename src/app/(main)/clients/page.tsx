import { Suspense } from 'react';
import { ClientAnalysisTableSectionServer } from '@/components/dashboard/ClientAnalysisTableSectionServer';
import { ClientsSummarySectionServer } from '@/components/dashboard/ClientsSummarySectionServer';
import {
  CompactSummarySkeleton,
  TableCardSkeleton,
} from '@/components/skeletons/analytics';
import { parseClientTableState } from '@/lib/dashboard-route-state';
import type { PageSearchParams } from '@/lib/filter-url-state';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const tableState = parseClientTableState(resolvedSearchParams);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-page-title">Client Analysis</h1>

      <Suspense fallback={<CompactSummarySkeleton items={4} />}>
        <ClientsSummarySectionServer />
      </Suspense>

      <Suspense fallback={<TableCardSkeleton rows={10} titleWidth="10rem" />}>
        <ClientAnalysisTableSectionServer tableState={tableState} />
      </Suspense>
    </div>
  );
}
