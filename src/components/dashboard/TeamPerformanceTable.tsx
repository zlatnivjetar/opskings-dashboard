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
  type Column,
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
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUp, ArrowDown, ArrowUpDown, ListFilter } from 'lucide-react';
import { getTeamPerformance, type TeamPerformanceRow } from '@/lib/queries/team';
import { formatUsername } from '@/lib/format';
import { cn } from '@/lib/utils';

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

  const candidates = withTickets.filter(
    (r) => r.resolutionRate === maxRate && (r.avgRating ?? 0) >= avgRating
  );
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  return candidates[0].id;
}

// ─── Sort icon ────────────────────────────────────────────────────────────

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (!direction) return <ArrowUpDown className="h-3.5 w-3.5 opacity-35" />;
  return direction === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5" />
    : <ArrowDown className="h-3.5 w-3.5" />;
}

// ─── Text filter popover ──────────────────────────────────────────────────

function TextFilterPopover({ column }: { column: Column<TeamPerformanceRow> }) {
  const value = (column.getFilterValue() as string) ?? '';
  const isActive = value.length > 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'rounded p-0.5 hover:bg-muted transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilter className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-3 space-y-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground">
          {String(column.columnDef.header)}
        </p>
        <Input
          placeholder="Filter…"
          value={value}
          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
          className="h-7 text-xs"
          autoFocus
        />
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs"
            onClick={() => column.setFilterValue(undefined)}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ─── Range filter popover ─────────────────────────────────────────────────

function RangeFilterPopover({ column }: { column: Column<TeamPerformanceRow> }) {
  const [min, max] = (column.getFilterValue() as [number | '', number | '']) ?? ['', ''];
  const isActive = min !== '' || max !== '';

  const set = (newMin: number | '', newMax: number | '') => {
    if (newMin === '' && newMax === '') {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue([newMin, newMax]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'rounded p-0.5 hover:bg-muted transition-colors',
            isActive ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <ListFilter className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-48 p-3 space-y-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-medium text-muted-foreground">
          {String(column.columnDef.header)}
        </p>
        <div className="flex gap-1.5">
          <Input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => set(e.target.value === '' ? '' : Number(e.target.value), max)}
            className="h-7 text-xs"
            autoFocus
          />
          <Input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => set(min, e.target.value === '' ? '' : Number(e.target.value))}
            className="h-7 text-xs"
          />
        </div>
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-full text-xs"
            onClick={() => column.setFilterValue(undefined)}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
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
            <span>{formatUsername(row.original.username)}</span>
            {row.original.id === topPerformerId && (
              <Badge className="text-[10px] px-1.5 py-0 bg-success/15 text-success border-success/30 border">
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
        cell: ({ getValue }) => <StatusBadge status={getValue<string>()} />,
      },
    ],
    [topPerformerId]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
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

  const textCols = new Set(['username', 'department', 'status']);
  const numericCols = new Set(['assigned', 'resolved', 'resolutionRate', 'avgResolutionHours', 'avgRating']);

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
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const colId = header.column.id;
                  const isText = textCols.has(colId);
                  const isNum = numericCols.has(colId);
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1'
                              : 'flex items-center'
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <SortIcon direction={header.column.getIsSorted()} />
                          )}
                        </div>
                        {isText && <TextFilterPopover column={header.column} />}
                        {isNum && <RangeFilterPopover column={header.column} />}
                      </div>
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
                    row.original.id === topPerformerId ? 'bg-success/10' : ''
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
