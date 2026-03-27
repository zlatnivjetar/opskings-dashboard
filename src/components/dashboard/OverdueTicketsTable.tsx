import type { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PriorityBadge } from '@/components/ui/priority-badge';
import type { OverdueTicketRow } from '@/lib/queries/response-time';
import { formatDate } from '@/lib/format';

function fmt(hours: number): string {
  return hours >= 1 ? `${hours.toFixed(1)}h` : `${Math.round(hours * 60)}m`;
}

interface OverdueTicketsTableProps {
  footer?: ReactNode;
  rows: OverdueTicketRow[];
}

export function OverdueTicketsTable({ footer, rows }: OverdueTicketsTableProps) {
  const columns = 9;

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Excess</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns} className="py-8 text-center text-muted-foreground">
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
                  <TableCell className="whitespace-nowrap">{row.typeName}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={row.priority} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-caption">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {fmt(row.actualHours)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {fmt(row.expectedHours)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold">+{fmt(row.excessHours)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {footer}
    </div>
  );
}
