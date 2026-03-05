'use server';

import { sql, eq, desc } from 'drizzle-orm';
import { adminDb } from '@/lib/db';
import { tickets, ticketTypes } from '@/lib/db/schema';
import { withRLS } from '@/lib/db/rls-client';
import { applyTicketFilters } from '@/lib/queries/filters';
import { getUserContext } from '@/lib/auth/get-user-context';
import type { FilterState, MultiFilter } from '@/types/filters';

export type DashboardSummary = {
  totalTickets: number;
  openTickets: number;
  avgResolutionHours: number | null;
  avgRating: number | null;
};

export type TicketsOverTimeRow = {
  month: string; // 'YYYY-MM-01'
  created: number;
  resolved: number;
};

// ---------------------------------------------------------------------------
// Filter → serialized params (all plain strings or null so postgres.js is happy)
// ---------------------------------------------------------------------------

// Postgres array literal: [1, 2] → '{1,2}',  null → null
function pgIntArr(arr: number[] | null): string | null {
  return arr ? `{${arr.join(',')}}` : null;
}
function pgTextArr(arr: string[] | null): string | null {
  return arr ? `{${arr.join(',')}}` : null;
}

function toIncludeInt(f?: MultiFilter): number[] | null {
  if (!f || f.values.length === 0) return null;
  return f.operator === 'is' || f.operator === 'isAnyOf' ? (f.values as number[]) : null;
}
function toExcludeInt(f?: MultiFilter): number[] | null {
  if (!f || f.values.length === 0) return null;
  return f.operator === 'isNot' || f.operator === 'isNoneOf' ? (f.values as number[]) : null;
}
function toIncludeStr(f?: MultiFilter): string[] | null {
  if (!f || f.values.length === 0) return null;
  return f.operator === 'is' || f.operator === 'isAnyOf' ? (f.values as string[]) : null;
}
function toExcludeStr(f?: MultiFilter): string[] | null {
  if (!f || f.values.length === 0) return null;
  return f.operator === 'isNot' || f.operator === 'isNoneOf' ? (f.values as string[]) : null;
}

type RLSParams = {
  dateFrom: string | null;       // ISO 8601 → cast ::timestamptz in SQL
  dateTo: string | null;
  assignedInclude: string | null; // '{1,2}' → cast ::int[] in SQL
  assignedExclude: string | null;
  typeInclude: string | null;
  typeExclude: string | null;
  priorityInclude: string | null; // '{low,high}' → cast ::text[] in SQL
  priorityExclude: string | null;
};

function toRLSParams(filters: FilterState): RLSParams {
  let dateFrom: string | null = null;
  let dateTo: string | null = null;

  if (filters.date) {
    const { operator, value, valueTo } = filters.date;
    switch (operator) {
      case 'exact':
        dateFrom = new Date(value + 'T00:00:00.000Z').toISOString();
        dateTo = new Date(value + 'T23:59:59.999Z').toISOString();
        break;
      case 'range':
        dateFrom = new Date(value).toISOString();
        dateTo = new Date((valueTo ?? value) + 'T23:59:59.999Z').toISOString();
        break;
      case 'onOrAfter':
        dateFrom = new Date(value).toISOString();
        break;
      case 'onOrBefore':
        dateTo = new Date(value + 'T23:59:59.999Z').toISOString();
        break;
    }
  }

  return {
    dateFrom,
    dateTo,
    assignedInclude: pgIntArr(toIncludeInt(filters.teamMember)),
    assignedExclude: pgIntArr(toExcludeInt(filters.teamMember)),
    typeInclude:     pgIntArr(toIncludeInt(filters.ticketType)),
    typeExclude:     pgIntArr(toExcludeInt(filters.ticketType)),
    priorityInclude: pgTextArr(toIncludeStr(filters.priority)),
    priorityExclude: pgTextArr(toExcludeStr(filters.priority)),
  };
}

// ---------------------------------------------------------------------------
// Server actions — single round-trip via RLS-aware DB functions
// ---------------------------------------------------------------------------

export async function getDashboardSummary(filters: FilterState): Promise<DashboardSummary> {
  const ctx = await getUserContext();
  const p = toRLSParams(filters);

  const rows = await adminDb.execute<{
    total_tickets: number;
    open_tickets: number;
    avg_resolution_hours: string | null;
    avg_rating: string | null;
  }>(sql`
    SELECT * FROM get_dashboard_summary_rls(
      ${ctx.userId},
      ${ctx.role},
      ${ctx.clientId ? String(ctx.clientId) : ''},
      ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
      ${p.dateFrom}::timestamptz,
      ${p.dateTo}::timestamptz,
      ${p.assignedInclude}::int[],
      ${p.assignedExclude}::int[],
      ${p.typeInclude}::int[],
      ${p.typeExclude}::int[],
      ${p.priorityInclude}::text[],
      ${p.priorityExclude}::text[]
    )
  `);

  const row = rows[0];
  return {
    totalTickets: row.total_tickets ?? 0,
    openTickets: row.open_tickets ?? 0,
    avgResolutionHours:
      row.avg_resolution_hours != null ? Number(row.avg_resolution_hours) : null,
    avgRating: row.avg_rating != null ? Number(row.avg_rating) : null,
  };
}

export type TicketsByTypeRow = {
  ticketTypeId: number;
  typeName: string;
  count: number;
  percentage: number;
};

export type TicketsByPriorityRow = {
  priority: string;
  open: number;
  in_progress: number;
  resolved: number;
};

export async function getTicketsByType(filters: FilterState): Promise<TicketsByTypeRow[]> {
  const ctx = await getUserContext();
  const distFilters: FilterState = { date: filters.date, teamMember: filters.teamMember };
  const whereClause = applyTicketFilters([], distFilters);

  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        ticketTypeId: ticketTypes.id,
        typeName: ticketTypes.typeName,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(whereClause)
      .groupBy(ticketTypes.id, ticketTypes.typeName)
      .orderBy(desc(sql`COUNT(*)`));

    const total = rows.reduce((s, r) => s + r.count, 0);
    return rows.map((r) => ({
      ticketTypeId: r.ticketTypeId,
      typeName: r.typeName,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
    }));
  });
}

export async function getTicketsByPriority(filters: FilterState): Promise<TicketsByPriorityRow[]> {
  const ctx = await getUserContext();
  const distFilters: FilterState = { date: filters.date, teamMember: filters.teamMember };
  const whereClause = applyTicketFilters([], distFilters);

  return withRLS(ctx, async (tx) => {
    const rows = await tx
      .select({
        priority: tickets.priority,
        open: sql<number>`SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int`,
        in_progress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int`,
        resolved: sql<number>`SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int`,
      })
      .from(tickets)
      .where(whereClause)
      .groupBy(tickets.priority)
      .orderBy(
        sql`CASE priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 ELSE 5 END`,
      );

    return rows.map((r) => ({
      priority: r.priority ?? 'unknown',
      open: r.open ?? 0,
      in_progress: r.in_progress ?? 0,
      resolved: r.resolved ?? 0,
    }));
  });
}

// Combined action — one HTTP round-trip, both queries run in parallel via Promise.all.
// Replaces the two-separate-useQuery pattern that Next.js serialises.
export async function getDashboardAll(
  filters: FilterState,
): Promise<{ summary: DashboardSummary; ticketsOverTime: TicketsOverTimeRow[] }> {
  const ctx = await getUserContext();
  const p = toRLSParams(filters);

  const [summaryRows, timeRows] = await Promise.all([
    adminDb.execute<{
      total_tickets: number;
      open_tickets: number;
      avg_resolution_hours: string | null;
      avg_rating: string | null;
    }>(sql`
      SELECT * FROM get_dashboard_summary_rls(
        ${ctx.userId}, ${ctx.role},
        ${ctx.clientId ? String(ctx.clientId) : ''},
        ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
        ${p.dateFrom}::timestamptz, ${p.dateTo}::timestamptz,
        ${p.assignedInclude}::int[], ${p.assignedExclude}::int[],
        ${p.typeInclude}::int[],    ${p.typeExclude}::int[],
        ${p.priorityInclude}::text[], ${p.priorityExclude}::text[]
      )
    `),
    adminDb.execute<{ month: string; created: number; resolved: number }>(sql`
      SELECT * FROM get_tickets_over_time_rls(
        ${ctx.userId}, ${ctx.role},
        ${ctx.clientId ? String(ctx.clientId) : ''},
        ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
        ${p.dateFrom}::timestamptz, ${p.dateTo}::timestamptz,
        ${p.assignedInclude}::int[], ${p.assignedExclude}::int[],
        ${p.typeInclude}::int[],    ${p.typeExclude}::int[],
        ${p.priorityInclude}::text[], ${p.priorityExclude}::text[]
      )
    `),
  ]);

  const sr = summaryRows[0];
  return {
    summary: {
      totalTickets: sr.total_tickets ?? 0,
      openTickets: sr.open_tickets ?? 0,
      avgResolutionHours:
        sr.avg_resolution_hours != null ? Number(sr.avg_resolution_hours) : null,
      avgRating: sr.avg_rating != null ? Number(sr.avg_rating) : null,
    },
    ticketsOverTime: timeRows.map((r) => ({ month: r.month, created: r.created, resolved: r.resolved })),
  };
}

export async function getTicketsOverTime(filters: FilterState): Promise<TicketsOverTimeRow[]> {
  const ctx = await getUserContext();
  const p = toRLSParams(filters);

  const rows = await adminDb.execute<{
    month: string;
    created: number;
    resolved: number;
  }>(sql`
    SELECT * FROM get_tickets_over_time_rls(
      ${ctx.userId},
      ${ctx.role},
      ${ctx.clientId ? String(ctx.clientId) : ''},
      ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
      ${p.dateFrom}::timestamptz,
      ${p.dateTo}::timestamptz,
      ${p.assignedInclude}::int[],
      ${p.assignedExclude}::int[],
      ${p.typeInclude}::int[],
      ${p.typeExclude}::int[],
      ${p.priorityInclude}::text[],
      ${p.priorityExclude}::text[]
    )
  `);

  return rows.map((r) => ({ month: r.month, created: r.created, resolved: r.resolved }));
}

// Combined distribution action — replaces two sequential useQuery calls.
export async function getDistributionAll(
  filters: FilterState,
): Promise<{ byType: TicketsByTypeRow[]; byPriority: TicketsByPriorityRow[] }> {
  const ctx = await getUserContext();
  const distFilters: FilterState = { date: filters.date, teamMember: filters.teamMember };
  const whereClause = applyTicketFilters([], distFilters);

  const [byType, byPriority] = await Promise.all([
    withRLS(ctx, (tx) =>
      tx
        .select({
          ticketTypeId: ticketTypes.id,
          typeName: ticketTypes.typeName,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(tickets)
        .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
        .where(whereClause)
        .groupBy(ticketTypes.id, ticketTypes.typeName)
        .orderBy(desc(sql`COUNT(*)`)),
    ),
    withRLS(ctx, (tx) =>
      tx
        .select({
          priority: tickets.priority,
          open: sql<number>`SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int`,
          in_progress: sql<number>`SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int`,
          resolved: sql<number>`SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int`,
        })
        .from(tickets)
        .where(whereClause)
        .groupBy(tickets.priority)
        .orderBy(
          sql`CASE priority WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 ELSE 5 END`,
        ),
    ),
  ]);

  const total = byType.reduce((s, r) => s + r.count, 0);
  return {
    byType: byType.map((r) => ({
      ticketTypeId: r.ticketTypeId,
      typeName: r.typeName,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 1000) / 10 : 0,
    })),
    byPriority: byPriority.map((r) => ({
      priority: r.priority ?? 'unknown',
      open: r.open ?? 0,
      in_progress: r.in_progress ?? 0,
      resolved: r.resolved ?? 0,
    })),
  };
}
