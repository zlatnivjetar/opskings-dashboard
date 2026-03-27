import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchParamPagination } from '@/components/dashboard/SearchParamPagination';
import { TeamPerformanceTableControls } from '@/components/dashboard/TeamPerformanceTableControls';
import {
  TEAM_TABLE_PAGE_PARAM,
  type TeamTableSort,
  type TeamTableState,
} from '@/lib/dashboard-route-state';
import { formatUsername } from '@/lib/format';
import { getTeamPerformance, type TeamPerformanceRow } from '@/lib/queries/team';
import type { FilterState } from '@/types/filters';

function compareNullableNumbers(
  left: number | null,
  right: number | null,
  sortOrder: 'asc' | 'desc',
): number {
  if (left == null && right == null) {
    return 0;
  }

  if (left == null) {
    return 1;
  }

  if (right == null) {
    return -1;
  }

  return sortOrder === 'asc' ? left - right : right - left;
}

function sortRows(rows: TeamPerformanceRow[], sortBy: TeamTableSort, sortOrder: 'asc' | 'desc') {
  return [...rows].sort((left, right) => {
    switch (sortBy) {
      case 'username':
        return sortOrder === 'asc'
          ? left.username.localeCompare(right.username)
          : right.username.localeCompare(left.username);
      case 'department':
        return sortOrder === 'asc'
          ? left.department.localeCompare(right.department)
          : right.department.localeCompare(left.department);
      case 'status':
        return sortOrder === 'asc'
          ? left.status.localeCompare(right.status)
          : right.status.localeCompare(left.status);
      case 'assigned':
        return sortOrder === 'asc' ? left.assigned - right.assigned : right.assigned - left.assigned;
      case 'resolved':
        return sortOrder === 'asc' ? left.resolved - right.resolved : right.resolved - left.resolved;
      case 'avgResolutionHours':
        return compareNullableNumbers(left.avgResolutionHours, right.avgResolutionHours, sortOrder);
      case 'avgRating':
        return compareNullableNumbers(left.avgRating, right.avgRating, sortOrder);
    }
  });
}

function formatMetric(value: number | null, suffix = ''): string {
  return value == null ? '--' : `${value.toFixed(1)}${suffix}`;
}

export async function TeamPerformanceTableSectionServer({
  filters,
  tableState,
}: {
  filters: FilterState;
  tableState: TeamTableState;
}) {
  const rows = await getTeamPerformance(filters);
  const query = tableState.query.trim().toLowerCase();

  const departmentOptions = [...new Set(rows.map((row) => row.department))].sort((left, right) =>
    left.localeCompare(right),
  );
  const statusOptions = [...new Set(rows.map((row) => row.status))].sort((left, right) =>
    left.localeCompare(right),
  );

  const filteredRows = rows.filter((row) => {
    if (query.length > 0) {
      const haystack = [
        row.username,
        formatUsername(row.username),
        row.department,
        row.status,
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (tableState.department && row.department !== tableState.department) {
      return false;
    }

    if (tableState.status && row.status !== tableState.status) {
      return false;
    }

    return true;
  });

  const sortedRows = sortRows(filteredRows, tableState.sortBy, tableState.sortOrder);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / tableState.pageSize));
  const page = Math.min(tableState.page, totalPages);
  const startIndex = (page - 1) * tableState.pageSize;
  const pageRows = sortedRows.slice(startIndex, startIndex + tableState.pageSize);
  const isFiltered =
    tableState.query.length > 0 || tableState.department.length > 0 || tableState.status.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Team Performance</CardTitle>
            <p className="text-caption">
              Ticket ownership, throughput, and quality for the current filter set.
            </p>
          </div>
          <p className="text-caption">
            {filteredRows.length.toLocaleString()} team members
            {isFiltered ? ' (filtered)' : ''}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <TeamPerformanceTableControls
          key={[
            tableState.query,
            tableState.department,
            tableState.status,
            tableState.sortBy,
            tableState.sortOrder,
          ].join('|')}
          departmentOptions={departmentOptions}
          initialState={tableState}
          statusOptions={statusOptions}
        />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Resolved</TableHead>
                <TableHead className="text-right">Avg Time (hrs)</TableHead>
                <TableHead className="text-right">Avg Rating</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No team members match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{formatUsername(row.username)}</TableCell>
                    <TableCell>{row.department}</TableCell>
                    <TableCell className="text-right">{row.assigned.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{row.resolved.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {formatMetric(row.avgResolutionHours)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMetric(row.avgRating, ' / 5')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3">
          <SearchParamPagination
            countLabel={`${filteredRows.length.toLocaleString()} team members${isFiltered ? ' (filtered)' : ''}`}
            page={page}
            pageParam={TEAM_TABLE_PAGE_PARAM}
            totalPages={totalPages}
          />
        </div>
      </CardContent>
    </Card>
  );
}
