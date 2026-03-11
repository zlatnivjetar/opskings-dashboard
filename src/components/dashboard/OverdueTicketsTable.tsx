'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PriorityBadge } from '@/components/ui/priority-badge';
import type { OverdueTicketRow } from '@/lib/queries/response-time';
import { formatDate } from '@/lib/format';

function fmt(hours: number): string {
  return hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(hours * 60)}m`;
}

interface OverdueTicketsTableProps {
  rows: OverdueTicketRow[];
  totalCount: number;
  totalPages: number;
  page: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export function OverdueTicketsTable({
  rows,
  totalCount,
  totalPages,
  page,
  onPageChange,
  isLoading,
}: OverdueTicketsTableProps) {
  const COLS = 9;

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Created</TableHead>
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
                  <TableCell className="text-sm text-muted-foreground">#{row.ticketId}</TableCell>
                  <TableCell className="max-w-[220px] truncate" title={row.title}>
                    {row.title}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.clientName}</TableCell>
                  <TableCell className="whitespace-nowrap text-caption">{formatDate(row.createdAt)}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.typeName}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={row.priority} />
                  </TableCell>
                  <TableCell className="text-right text-sm">{fmt(row.actualHours)}</TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{fmt(row.expectedHours)}</TableCell>
                  <TableCell className="text-right text-sm font-bold">+{fmt(row.excessHours)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount.toLocaleString()} overdue tickets</span>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
