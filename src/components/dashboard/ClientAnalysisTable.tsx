'use client';

import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getClientAnalysis,
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

export function ClientAnalysisTable() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortableColumn>('totalTickets');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = { search: debouncedSearch, page, pageSize: 20, sortBy, sortOrder };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['clients', 'analysis', queryParams],
    queryFn: () => getClientAnalysis(queryParams),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const handleSort = (col: SortableColumn) => {
    if (sortBy === col) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const sortIndicator = (col: SortableColumn) => {
    if (sortBy !== col) return <span className="ml-1 text-muted-foreground/40">↕</span>;
    return (
      <span className="ml-1 text-foreground">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    );
  };

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search clients..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className={`rounded-md border transition-opacity duration-150 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
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
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center py-8 text-muted-foreground">
                  No clients found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
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
        <span>{totalCount.toLocaleString()} clients total</span>
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
