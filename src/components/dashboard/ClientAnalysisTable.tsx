'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getClientAnalysis,
  type ClientAnalysisRow,
  type SortableColumn,
} from '@/lib/queries/clients';

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  starter: { label: 'Starter', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  professional: { label: 'Professional', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  enterprise: { label: 'Enterprise', className: 'bg-purple-100 text-purple-700 border-purple-200' },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

type Column = {
  key: SortableColumn;
  label: string;
};

const COLUMNS: Column[] = [
  { key: 'clientName', label: 'Client Name' },
  { key: 'planType', label: 'Plan' },
  { key: 'totalTickets', label: 'Total Tickets' },
  { key: 'openTickets', label: 'Open Tickets' },
  { key: 'totalSpent', label: 'Total Spent' },
  { key: 'lastTicketDate', label: 'Last Ticket' },
];

const PAGE_SIZE = 20;

function compareRows(a: ClientAnalysisRow, b: ClientAnalysisRow, sortBy: SortableColumn, sortOrder: 'asc' | 'desc'): number {
  const aVal = a[sortBy];
  const bVal = b[sortBy];
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;
  const cmp = typeof aVal === 'string'
    ? aVal.localeCompare(bVal as string)
    : (aVal as number) - (bVal as number);
  return sortOrder === 'asc' ? cmp : -cmp;
}

export function ClientAnalysisTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortableColumn>('totalTickets');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch ALL clients once — only ~50 rows.
  const { data, isLoading } = useQuery({
    queryKey: ['clients', 'analysis', 'all'],
    queryFn: () => getClientAnalysis({ pageSize: 1000 }),
    staleTime: 30_000,
  });

  const allRows = data?.rows ?? [];

  // Client-side search
  const filtered = useMemo(() => {
    if (!search) return allRows;
    const q = search.toLowerCase();
    return allRows.filter((r) =>
      r.clientName.toLowerCase().includes(q) || r.planType.toLowerCase().includes(q),
    );
  }, [allRows, search]);

  // Client-side sort
  const sorted = useMemo(
    () => [...filtered].sort((a, b) => compareRows(a, b, sortBy, sortOrder)),
    [filtered, sortBy, sortOrder],
  );

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = (col: SortableColumn) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const sortIndicator = (col: SortableColumn) => {
    if (sortBy !== col) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return (
      <span className="ml-1 text-foreground">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    );
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none whitespace-nowrap hover:bg-muted/50"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  {sortIndicator(col.key)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {COLUMNS.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">
                  No clients found
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const plan = PLAN_BADGE[row.planType] ?? {
                  label: row.planType,
                  className: 'bg-gray-100 text-gray-700',
                };
                return (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.clientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={plan.className}>
                        {plan.label}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.totalTickets.toLocaleString()}</TableCell>
                    <TableCell>{row.openTickets.toLocaleString()}</TableCell>
                    <TableCell>
                      {row.totalSpent != null ? formatCurrency(row.totalSpent) : '—'}
                    </TableCell>
                    <TableCell>
                      {row.lastTicketDate ? formatDate(row.lastTicketDate) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{sorted.length.toLocaleString()} clients{search ? ' (filtered)' : ' total'}</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={safePage <= 1}
            >
              Previous
            </Button>
            <span>
              Page {safePage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
