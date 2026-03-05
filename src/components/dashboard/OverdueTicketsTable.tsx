'use client';

import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getOverdueTickets } from '@/lib/queries/response-time';
import type { FilterState } from '@/types/filters';

const PRIORITY_STYLES: Record<string, string> = {
  low:      'bg-slate-100 text-slate-700',
  medium:   'bg-yellow-100 text-yellow-700',
  high:     'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

function fmt(hours: number): string {
  return hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(hours * 60)}m`;
}

export function OverdueTicketsTable({ filters }: { filters: FilterState }) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['response-time', 'overdue', filters, page],
    queryFn: () => getOverdueTickets(filters, { page, pageSize: 20 }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const rows = data?.rows ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const COLS = 8;

  return (
    <div className="space-y-3">
      <div
        className={`rounded-md border transition-opacity duration-150 ${
          isFetching && !isLoading ? 'opacity-60' : 'opacity-100'
        }`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Excess</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLS }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLS} className="text-center py-8 text-muted-foreground">
                  No overdue tickets found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.ticketId}>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    #{row.ticketId}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate" title={row.title}>
                    {row.title}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.clientName}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.typeName}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={PRIORITY_STYLES[row.priority] ?? ''}
                    >
                      {row.priority.charAt(0).toUpperCase() + row.priority.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {fmt(row.actualHours)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground">
                    {fmt(row.expectedHours)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold text-red-600">
                    +{fmt(row.excessHours)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalCount.toLocaleString()} overdue tickets</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1 || isLoading}
          >
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
