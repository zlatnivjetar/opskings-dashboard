'use server';

import { and, eq, inArray, ne, notInArray, sql, type SQL } from 'drizzle-orm';
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

export type TeamPerformanceSummary = {
  totalMembers: number;
  activeMembers: number;
  resolvedTickets: number;
  avgResolutionHours: number | null;
  avgRating: number | null;
};

function getTeamMemberWhereClause(filters: FilterState): SQL | undefined {
  if (!filters.teamMember || filters.teamMember.values.length === 0) {
    return undefined;
  }

  const values = filters.teamMember.values as number[];
  switch (filters.teamMember.operator) {
    case 'is':
      return eq(teamMembers.id, values[0]);
    case 'isNot':
      return ne(teamMembers.id, values[0]);
    case 'isAnyOf':
      return inArray(teamMembers.id, values);
    case 'isNoneOf':
      return notInArray(teamMembers.id, values);
  }
}

export async function getTeamPerformanceSummary(
  filters: FilterState = {},
): Promise<TeamPerformanceSummary> {
  const ctx = await getUserContext();
  const ticketFilterConditions = applyTicketFilters([], filters);
  const ticketsJoinCondition = ticketFilterConditions
    ? and(eq(tickets.assignedTo, teamMembers.id), ticketFilterConditions)
    : eq(tickets.assignedTo, teamMembers.id);
  const memberWhereClause = getTeamMemberWhereClause(filters);

  return withRLS(ctx, async (tx) => {
    const [memberRows, aggregateRows] = await Promise.all([
      tx
        .select({
          totalMembers: sql<number>`COUNT(*)::int`,
          activeMembers: sql<number>`COUNT(*) FILTER (WHERE ${teamMembers.status} = 'active')::int`,
        })
        .from(teamMembers)
        .where(memberWhereClause),
      tx
        .select({
          resolvedTickets: sql<number>`COUNT(${tickets.id}) FILTER (WHERE ${tickets.status} = 'resolved')::int`,
          avgResolutionHours: sql<string | null>`AVG(
            EXTRACT(EPOCH FROM (${tickets.resolvedAt} - ${tickets.createdAt})) / 3600.0
          ) FILTER (WHERE ${tickets.resolvedAt} IS NOT NULL)::text`,
          avgRating: sql<string | null>`AVG(${ticketFeedback.rating})::text`,
        })
        .from(teamMembers)
        .leftJoin(tickets, ticketsJoinCondition)
        .leftJoin(ticketFeedback, eq(ticketFeedback.ticketId, tickets.id))
        .where(memberWhereClause),
    ]);

    const memberRow = memberRows[0];
    const aggregateRow = aggregateRows[0];

    return {
      totalMembers: memberRow?.totalMembers ?? 0,
      activeMembers: memberRow?.activeMembers ?? 0,
      resolvedTickets: aggregateRow?.resolvedTickets ?? 0,
      avgResolutionHours:
        aggregateRow?.avgResolutionHours != null ? Number(aggregateRow.avgResolutionHours) : null,
      avgRating: aggregateRow?.avgRating != null ? Number(aggregateRow.avgRating) : null,
    };
  });
}

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
