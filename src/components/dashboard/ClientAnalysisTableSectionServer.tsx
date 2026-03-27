import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlanBadge } from '@/components/ui/plan-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClientAnalysisTableControls } from '@/components/dashboard/ClientAnalysisTableControls';
import { SearchParamPagination } from '@/components/dashboard/SearchParamPagination';
import {
  CLIENTS_TABLE_PAGE_PARAM,
  type ClientTableState,
} from '@/lib/dashboard-route-state';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  getClientAnalysis,
  type ClientAnalysisRow,
  type SortableColumn,
} from '@/lib/queries/clients';

function compareRows(
  left: ClientAnalysisRow,
  right: ClientAnalysisRow,
  sortBy: SortableColumn,
  sortOrder: 'asc' | 'desc',
): number {
  const leftValue = left[sortBy];
  const rightValue = right[sortBy];

  if (leftValue == null && rightValue == null) {
    return 0;
  }

  if (leftValue == null) {
    return 1;
  }

  if (rightValue == null) {
    return -1;
  }

  const comparison =
    typeof leftValue === 'string'
      ? leftValue.localeCompare(rightValue as string)
      : (leftValue as number) - (rightValue as number);

  return sortOrder === 'asc' ? comparison : -comparison;
}

function matchesPlanFilter(planType: string, plan: ClientTableState['plan']): boolean {
  if (!plan || plan.values.length === 0) {
    return true;
  }

  const values = plan.values as string[];
  const firstValue = values[0];
  const hasMatch = values.includes(planType);

  switch (plan.operator) {
    case 'is':
      return planType === firstValue;
    case 'isNot':
      return planType !== firstValue;
    case 'isAnyOf':
      return hasMatch;
    case 'isNoneOf':
      return !hasMatch;
  }
}

export async function ClientAnalysisTableSectionServer({
  tableState,
}: {
  tableState: ClientTableState;
}) {
  const result = await getClientAnalysis({ page: 1, pageSize: 1000 });
  const planOptions = [...new Set(result.rows.map((row) => row.planType))]
    .sort((left, right) => left.localeCompare(right))
    .map((plan) => ({ label: plan, value: plan }));

  const query = tableState.query.trim().toLowerCase();
  const filteredRows = result.rows.filter((row) => {
    if (query.length > 0 && !row.clientName.toLowerCase().includes(query)) {
      return false;
    }

    if (!matchesPlanFilter(row.planType, tableState.plan)) {
      return false;
    }

    if (tableState.ticketsMin != null && row.totalTickets < tableState.ticketsMin) {
      return false;
    }

    if (tableState.ticketsMax != null && row.totalTickets > tableState.ticketsMax) {
      return false;
    }

    if (tableState.openMin != null && row.openTickets < tableState.openMin) {
      return false;
    }

    if (tableState.openMax != null && row.openTickets > tableState.openMax) {
      return false;
    }

    const totalSpent = row.totalSpent ?? 0;
    if (tableState.spentMin != null && totalSpent < tableState.spentMin) {
      return false;
    }

    if (tableState.spentMax != null && totalSpent > tableState.spentMax) {
      return false;
    }

    return true;
  });

  const sortedRows = [...filteredRows].sort((left, right) =>
    compareRows(left, right, tableState.sortBy, tableState.sortOrder),
  );
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / tableState.pageSize));
  const page = Math.min(tableState.page, totalPages);
  const startIndex = (page - 1) * tableState.pageSize;
  const pageRows = sortedRows.slice(startIndex, startIndex + tableState.pageSize);
  const isFiltered =
    tableState.query.length > 0 ||
    !!tableState.plan ||
    tableState.ticketsMin != null ||
    tableState.ticketsMax != null ||
    tableState.openMin != null ||
    tableState.openMax != null ||
    tableState.spentMin != null ||
    tableState.spentMax != null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Client Analysis</CardTitle>
            <p className="text-caption">
              Server-rendered portfolio table with URL-driven filtering and sorting.
            </p>
          </div>
          <p className="text-caption">
            {filteredRows.length.toLocaleString()} clients
            {isFiltered ? ' (filtered)' : ''}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ClientAnalysisTableControls
          key={[
            tableState.query,
            tableState.plan?.operator ?? '',
            tableState.plan?.values.join(',') ?? '',
            tableState.ticketsMin ?? '',
            tableState.ticketsMax ?? '',
            tableState.openMin ?? '',
            tableState.openMax ?? '',
            tableState.spentMin ?? '',
            tableState.spentMax ?? '',
            tableState.sortBy,
            tableState.sortOrder,
          ].join('|')}
          initialState={tableState}
          planOptions={planOptions}
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Total Tickets</TableHead>
                <TableHead className="text-right">Open Tickets</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Last Ticket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No clients match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.clientName}</TableCell>
                    <TableCell>
                      <PlanBadge plan={row.planType} />
                    </TableCell>
                    <TableCell className="text-right">{row.totalTickets.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.openTickets.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {row.totalSpent != null ? formatCurrency(row.totalSpent) : '--'}
                    </TableCell>
                    <TableCell>{row.lastTicketDate ? formatDate(row.lastTicketDate) : '--'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3">
          <SearchParamPagination
            countLabel={`${filteredRows.length.toLocaleString()} clients${isFiltered ? ' (filtered)' : ''}`}
            page={page}
            pageParam={CLIENTS_TABLE_PAGE_PARAM}
            totalPages={totalPages}
          />
        </div>
      </CardContent>
    </Card>
  );
}
