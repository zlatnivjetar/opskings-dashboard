import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OverdueTicketsTable } from '@/components/dashboard/OverdueTicketsTable';
import { SearchParamPagination } from '@/components/dashboard/SearchParamPagination';
import {
  RESPONSE_TIME_OVERDUE_PAGE_PARAM,
  RESPONSE_TIME_PAGE_SIZE,
} from '@/lib/dashboard-route-state';
import { formatCompact } from '@/lib/format';
import { getOverdueTickets, getResponseTimeOverview } from '@/lib/queries/response-time';
import type { FilterState } from '@/types/filters';

export async function ResponseTimeOverdueSectionServer({
  filters,
  page,
}: {
  filters: FilterState;
  page: number;
}) {
  const [overview, overdue] = await Promise.all([
    getResponseTimeOverview(filters),
    getOverdueTickets(filters, { page, pageSize: RESPONSE_TIME_PAGE_SIZE }),
  ]);

  const overduePct =
    overview.summary.resolvedCount > 0
      ? `${((overdue.totalCount / overview.summary.resolvedCount) * 100).toFixed(1)}% of resolved`
      : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Overdue Tickets</CardTitle>
            <p className="text-caption">
              Resolved tickets where actual resolution time exceeded the expected hours for the
              ticket type.
            </p>
          </div>
          <p className="text-caption">
            {formatCompact(overdue.totalCount)} overdue tickets
            {overduePct ? `, ${overduePct}` : ''}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <OverdueTicketsTable
          rows={overdue.rows}
          footer={
            <SearchParamPagination
              countLabel={`${overdue.totalCount.toLocaleString()} overdue tickets`}
              page={page}
              pageParam={RESPONSE_TIME_OVERDUE_PAGE_PARAM}
              totalPages={overdue.totalPages}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
