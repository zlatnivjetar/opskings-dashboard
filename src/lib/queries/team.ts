'use server';

import { and, eq, sql } from 'drizzle-orm';
import { withRLS } from '@/lib/db/rls-client';
import { getUserContext } from '@/lib/auth/get-user-context';
import { tickets, teamMembers, ticketFeedback } from '@/lib/db/schema';
import { applyTicketFilters } from '@/lib/queries/filters';
import type { FilterState } from '@/types/filters';

export type TeamPerformanceRow = {
  id: number;
  username: string;
  department: string;
  status: string;
  assigned: number;
  resolved: number;
  resolutionRate: number | null;
  avgResolutionHours: number | null;
  avgRating: number | null;
};

export async function getTeamPerformance(filters: FilterState = {}): Promise<TeamPerformanceRow[]> {
  const ctx = await getUserContext();
  const ticketFilterConditions = applyTicketFilters([], filters);
  const ticketsJoinCondition = ticketFilterConditions
    ? and(eq(tickets.assignedTo, teamMembers.id), ticketFilterConditions)
    : eq(tickets.assignedTo, teamMembers.id);

  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        id: teamMembers.id,
        username: teamMembers.username,
        department: teamMembers.department,
        status: teamMembers.status,
        assigned: sql<number>`COUNT(${tickets.id})::int`,
        resolved: sql<number>`COUNT(${tickets.id}) FILTER (WHERE ${tickets.status} = 'resolved')::int`,
        resolutionRate: sql<string | null>`
          CASE
            WHEN COUNT(${tickets.id}) > 0 THEN
              ROUND(
                COUNT(${tickets.id}) FILTER (WHERE ${tickets.status} = 'resolved')::numeric
                / COUNT(${tickets.id}) * 100,
                1
              )::text
            ELSE NULL
          END
        `,
        avgResolutionHours: sql<string | null>`AVG(
          EXTRACT(EPOCH FROM (${tickets.resolvedAt} - ${tickets.createdAt})) / 3600.0
        ) FILTER (WHERE ${tickets.resolvedAt} IS NOT NULL)::text`,
        avgRating: sql<string | null>`AVG(${ticketFeedback.rating})::text`,
      })
      .from(teamMembers)
      .leftJoin(tickets, ticketsJoinCondition)
      .leftJoin(ticketFeedback, eq(ticketFeedback.ticketId, tickets.id))
      .groupBy(
        teamMembers.id,
        teamMembers.username,
        teamMembers.department,
        teamMembers.status,
      )
      .orderBy(teamMembers.username);

    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      department: r.department,
      status: r.status ?? 'active',
      assigned: Number(r.assigned),
      resolved: Number(r.resolved),
      resolutionRate: r.resolutionRate != null ? Number(r.resolutionRate) : null,
      avgResolutionHours: r.avgResolutionHours != null ? Number(r.avgResolutionHours) : null,
      avgRating: r.avgRating != null ? Number(r.avgRating) : null,
    }));
  });
}
