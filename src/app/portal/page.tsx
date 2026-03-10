import Link from 'next/link';
import { getMyTickets } from '@/lib/queries/portal';
import { Button } from '@/components/ui/button';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { StatusBadge } from '@/components/ui/status-badge';

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr ?? '1') || 1);

  const { rows, totalPages } = await getMyTickets({ page, pageSize: 20 });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">My Tickets</h1>
        <Link href="/portal/new">
          <Button size="sm">New Ticket</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No tickets yet.{' '}
          <Link href="/portal/new" className="underline">
            Create one
          </Link>
          .
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
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
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          {page > 1 && (
            <Link href={`/portal?page=${page - 1}`}>
              <Button variant="outline" size="sm">
                Previous
              </Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/portal?page=${page + 1}`}>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
