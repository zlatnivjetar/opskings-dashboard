'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { FilterBar } from '@/components/filters/FilterBar';
import { useFilterState } from '@/hooks/use-filter-state';
import { getMyTickets } from '@/lib/queries/portal';

function PortalInner() {
  const { filters } = useFilterState();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['portal', 'tickets', filters, page],
    queryFn: () => getMyTickets({ page, pageSize, filters }),
    placeholderData: (previousData) => previousData,
  });

  const rows = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">My Tickets</h1>
      </div>

      <FilterBar
        allowedFilters={['date', 'ticketType', 'priority']}
        actions={
          <Link href="/portal/new">
            <Button size="sm">New Ticket</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-white border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium">Priority</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-48 animate-pulse" /></td>
                  <td className="px-4 py-3 hidden sm:table-cell"><div className="h-4 bg-muted rounded w-28 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
                  <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No tickets found.{' '}
          <Link href="/portal/new" className="underline">
            Create one
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead className="bg-white border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Priority</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/tickets/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {row.typeName}
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={row.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{totalCount.toLocaleString()} tickets</span>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev - 1)}
                  disabled={page <= 1 || isFetching}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                  {isFetching ? ' · Loading…' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={page >= totalPages || isFetching}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PortalContent() {
  return (
    <Suspense>
      <PortalInner />
    </Suspense>
  );
}
