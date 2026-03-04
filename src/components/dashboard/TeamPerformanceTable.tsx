'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getTeamPerformance, type TeamPerformanceRow } from '@/lib/queries/team';

// ─── Custom filter functions ───────────────────────────────────────────────

const numberRangeFilter: FilterFn<TeamPerformanceRow> = (row, columnId, filterValue) => {
  const [min, max] = filterValue as [number | '', number | ''];
  const val = row.getValue<number | null>(columnId);
  if (val == null) return min === '' && max === '';
  if (min !== '' && val < min) return false;
  if (max !== '' && val > max) return false;
  return true;
};
numberRangeFilter.autoRemove = (val) => {
  if (!Array.isArray(val)) return true;
  const [min, max] = val as [number | '', number | ''];
  return min === '' && max === '';
};

// ─── Top performer computation ─────────────────────────────────────────────

function findTopPerformerId(rows: TeamPerformanceRow[]): number | null {
  const withTickets = rows.filter((r) => r.assigned > 0 && r.resolutionRate != null);
  if (withTickets.length === 0) return null;

  const maxRate = Math.max(...withTickets.map((r) => r.resolutionRate!));
  const ratingsWithValues = rows.filter((r) => r.avgRating != null).map((r) => r.avgRating!);
  const avgRating =
    ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((a, b) => a + b, 0) / ratingsWithValues.length
      : 0;

  // Best resolution rate + rating above average
  const candidates = withTickets.filter(
    (r) => r.resolutionRate === maxRate && (r.avgRating ?? 0) >= avgRating
  );
  if (candidates.length === 0) return null;

  // Tiebreak: highest rating
  candidates.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  return candidates[0].id;
}

// ─── Column header filter controls ─────────────────────────────────────────

function TextFilter({ columnId, table }: { columnId: string; table: ReturnType<typeof useReactTable<TeamPerformanceRow>> }) {
  const column = table.getColumn(columnId);
  const value = (column?.getFilterValue() as string) ?? '';
  return (
    <Input
      placeholder="Filter…"
      value={value}
      onChange={(e) => column?.setFilterValue(e.target.value || undefined)}
      className="h-7 text-xs mt-1 w-32 mr-4 font-normal"
    />
  );
}

function RangeFilter({ columnId, table }: { columnId: string; table: ReturnType<typeof useReactTable<TeamPerformanceRow>> }) {
  const column = table.getColumn(columnId);
  const [min, max] = (column?.getFilterValue() as [number | '', number | '']) ?? ['', ''];

  const set = (newMin: number | '', newMax: number | '') => {
    if (newMin === '' && newMax === '') {
      column?.setFilterValue(undefined);
    } else {
      column?.setFilterValue([newMin, newMax]);
    }
  };

  return (
    <div className="flex gap-1 mt-1">
      <Input
        type="number"
        placeholder="Min"
        value={min}
        onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value), max)}
        className="h-7 text-xs w-16 font-normal"
      />
      <Input
        type="number"
        placeholder="Max"
        value={max}
        onChange={(e) => set(min, e.target.value === '' ? '' : Number(e.target.value))}
        className="h-7 text-xs w-16 font-normal"
      />
    </div>
  );
}

// ─── Sort indicator ────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (!direction) return <span className="ml-1 opacity-30">↕</span>;
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

// ─── Main table component ──────────────────────────────────────────────────

function fmt(val: number | null, decimals = 1): string {
  if (val == null) return '—';
  return val.toFixed(decimals);
}

export function TeamPerformanceTable() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['team', 'performance'],
    queryFn: () => getTeamPerformance(),
    staleTime: 30_000,
  });

  const topPerformerId = useMemo(() => findTopPerformerId(data), [data]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<TeamPerformanceRow>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Name',
        filterFn: 'includesString',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span>{row.original.username}</span>
            {row.original.id === topPerformerId && (
              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border-emerald-200 border">
                Top Performer
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'department',
        header: 'Department',
        filterFn: 'includesString',
      },
      {
        accessorKey: 'assigned',
        header: 'Assigned',
        filterFn: numberRangeFilter,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v === 0 ? '—' : v.toLocaleString('en-US');
        },
      },
      {
        accessorKey: 'resolved',
        header: 'Resolved',
        filterFn: numberRangeFilter,
        cell: ({ getValue }) => {
          const v = getValue<number>();
          return v === 0 ? '—' : v.toLocaleString('en-US');
        },
      },
      {
        accessorKey: 'resolutionRate',
        header: 'Resolution Rate',
        filterFn: numberRangeFilter,
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return v == null ? '—' : `${v.toFixed(1)}%`;
        },
      },
      {
        accessorKey: 'avgResolutionHours',
        header: 'Avg Time (hrs)',
        filterFn: numberRangeFilter,
        cell: ({ getValue }) => fmt(getValue<number | null>()),
      },
      {
        accessorKey: 'avgRating',
        header: 'Avg Rating',
        filterFn: numberRangeFilter,
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return v == null ? '—' : `${v.toFixed(1)} / 5`;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        filterFn: 'includesString',
        cell: ({ getValue }) => {
          const v = getValue<string>();
          return (
            <Badge variant={v === 'active' ? 'default' : 'secondary'} className="capitalize">
              {v}
            </Badge>
          );
        },
      },
    ],
    [topPerformerId]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const textCols = ['username', 'department', 'status'];
  const numericCols = ['assigned', 'resolved', 'resolutionRate', 'avgResolutionHours', 'avgRating'];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="align-top">
                {hg.headers.map((header) => {
                  const colId = header.column.id;
                  const isText = textCols.includes(colId);
                  const isNum = numericCols.includes(colId);
                  return (
                    <TableHead key={header.id} className="align-top pb-2">
                      <div
                        className={
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none inline-flex items-center font-semibold'
                            : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon direction={header.column.getIsSorted()} />
                        )}
                      </div>
                      {isText && <TextFilter columnId={colId} table={table} />}
                      {isNum && <RangeFilter columnId={colId} table={table} />}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  No results match your filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.original.id === topPerformerId ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : ''
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-3">
          {table.getRowModel().rows.length} of {data.length} team members shown
        </p>
      </CardContent>
    </Card>
  );
}
