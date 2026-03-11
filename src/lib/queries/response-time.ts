'use server';

import { sql, eq } from 'drizzle-orm';
import { adminDb } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { withRLS } from '@/lib/db/rls-client';
import { applyTicketFilters } from '@/lib/queries/filters';
import { getUserContext } from '@/lib/auth/get-user-context';
import type { FilterState, MultiFilter } from '@/types/filters';

// ─── Param serialisation (date + team member only) ────────────────────────────

function pgIntArr(arr: number[] | null): string | null {
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

type RTParams = {
  dateFrom: string | null;
  dateTo: string | null;
  assignedInclude: string | null;
  assignedExclude: string | null;
};

function toRTParams(filters: FilterState): RTParams {
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
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResolutionStatRow = {
  priority: string;
  minHours: number;
  maxHours: number;
  avgHours: number;
  medianHours: number;
  expectedHours: number;
};

export type OverdueTicketRow = {
  ticketId: number;
  title: string;
  clientName: string;
  createdAt: string;
  typeName: string;
  priority: string;
  actualHours: number;
  expectedHours: number;
  excessHours: number;
};

export type OverdueTicketsResult = {
  rows: OverdueTicketRow[];
  totalCount: number;
  totalPages: number;
};

export type ResolutionSummaryStats = {
  resolvedCount: number;
  avgHours: number | null;
  medianHours: number | null;
};

export type HistogramRow = {
  binLabel: string;
  low: number;
  medium: number;
  high: number;
  urgent: number;
};

// ─── Server Actions ───────────────────────────────────────────────────────────


export async function getResponseTimeSummary(
  filters: FilterState,
): Promise<ResolutionSummaryStats> {
  const ctx = await getUserContext();

  return withRLS(ctx, async (tx) => {
    const whereClause = applyTicketFilters(
      [eq(tickets.status, 'resolved')],
      { date: filters.date, teamMember: filters.teamMember },
    );
    const rows = await tx
      .select({
        resolvedCount: sql<number>`COUNT(*)::int`,
        avgHours: sql<string | null>`AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)`,
        medianHours: sql<string | null>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600)`,
      })
      .from(tickets)
      .where(whereClause);

    const row = rows[0];
    return {
      resolvedCount: row?.resolvedCount ?? 0,
      avgHours: row?.avgHours != null ? Number(row.avgHours) : null,
      medianHours: row?.medianHours != null ? Number(row.medianHours) : null,
    };
  });
}

export async function getResolutionTimeStats(
  filters: FilterState,
): Promise<ResolutionStatRow[]> {
  const ctx = await getUserContext();
  const p = toRTParams(filters);

  const rows = await adminDb.execute<{
    priority: string;
    min_hours: string;
    max_hours: string;
    avg_hours: string;
    median_hours: string;
    expected_hours: string | null;
  }>(sql`
    SELECT * FROM get_resolution_time_stats_rls(
      ${ctx.userId},
      ${ctx.role},
      ${ctx.clientId ? String(ctx.clientId) : ''},
      ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
      ${p.dateFrom}::timestamptz,
      ${p.dateTo}::timestamptz,
      ${p.assignedInclude}::int[],
      ${p.assignedExclude}::int[]
    )
  `);

  return rows.map((r) => ({
    priority: r.priority,
    minHours: Number(r.min_hours),
    maxHours: Number(r.max_hours),
    avgHours: Number(r.avg_hours),
    medianHours: Number(r.median_hours),
    expectedHours: r.expected_hours != null ? Number(r.expected_hours) : 0,
  }));
}

export async function getOverdueTickets(
  filters: FilterState,
  params: { page?: number; pageSize?: number } = {},
): Promise<OverdueTicketsResult> {
  const ctx = await getUserContext();
  const p = toRTParams(filters);
  const { page = 1, pageSize = 20 } = params;

  const rows = await adminDb.execute<{
    ticket_id: number;
    title: string;
    client_name: string;
    created_at: string;
    type_name: string;
    priority: string;
    actual_hours: string;
    expected_hours: string;
    excess_hours: string;
    full_count: string;
  }>(sql`
    SELECT * FROM get_overdue_tickets_rls(
      ${ctx.userId},
      ${ctx.role},
      ${ctx.clientId ? String(ctx.clientId) : ''},
      ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
      ${p.dateFrom}::timestamptz,
      ${p.dateTo}::timestamptz,
      ${p.assignedInclude}::int[],
      ${p.assignedExclude}::int[],
      ${page},
      ${pageSize}
    )
  `);

  const totalCount = rows.length > 0 ? Number(rows[0].full_count) : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    rows: rows.map((r) => ({
      ticketId: Number(r.ticket_id),
      title: r.title,
      clientName: r.client_name,
      createdAt: r.created_at,
      typeName: r.type_name,
      priority: r.priority,
      actualHours: Number(r.actual_hours),
      expectedHours: Number(r.expected_hours),
      excessHours: Number(r.excess_hours),
    })),
    totalCount,
    totalPages,
  };
}

// ─── Histogram helpers ───────────────────────────────────────────────────────

const FINE_BIN_LABELS = [
  '< 30m', '30m-1h', '1-2h', '2-4h', '4-6h',
  '6-8h', '8-12h', '12-16h', '16-24h', '24h+',
];

function emptyHistogram(): HistogramRow[] {
  return FINE_BIN_LABELS.map((binLabel) => ({
    binLabel, low: 0, medium: 0, high: 0, urgent: 0,
  }));
}


export async function getResolutionTimeHistogram(
  filters: FilterState,
): Promise<HistogramRow[]> {
  const ctx = await getUserContext();

  const histogramRows = await withRLS(ctx, async (tx) => {
    const whereClause = applyTicketFilters(
      [eq(tickets.status, 'resolved'), sql`${tickets.resolvedAt} IS NOT NULL`],
      { date: filters.date, teamMember: filters.teamMember },
    );
    const hoursExpr = sql`EXTRACT(EPOCH FROM (${tickets.resolvedAt} - ${tickets.createdAt})) / 3600.0`;
    const binExpr = sql`CASE
      WHEN ${hoursExpr} < 0.5 THEN 0
      WHEN ${hoursExpr} < 1   THEN 1
      WHEN ${hoursExpr} < 2   THEN 2
      WHEN ${hoursExpr} < 4   THEN 3
      WHEN ${hoursExpr} < 6   THEN 4
      WHEN ${hoursExpr} < 8   THEN 5
      WHEN ${hoursExpr} < 12  THEN 6
      WHEN ${hoursExpr} < 16  THEN 7
      WHEN ${hoursExpr} < 24  THEN 8
      ELSE 9
    END`;

    return tx
      .select({
        priority: tickets.priority,
        binIndex: sql<number>`(${binExpr})::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(tickets)
      .where(whereClause)
      .groupBy(tickets.priority, binExpr)
      .orderBy(binExpr, tickets.priority);
  });

  const histogram = emptyHistogram();
  for (const row of histogramRows) {
    const bin = histogram[row.binIndex];
    if (bin) {
      const priority = row.priority as 'low' | 'medium' | 'high' | 'urgent';
      if (priority in bin) bin[priority] = row.count;
    }
  }

  return histogram;
}

// Combined action — fires stats + overdue + summary + histogram in parallel.
// Fetches ALL overdue rows so the client can paginate instantly.

export type ResponseTimeOverview = {
  summary: ResolutionSummaryStats;
  histogram: HistogramRow[];
};

export async function getResponseTimeOverview(
  filters: FilterState,
): Promise<ResponseTimeOverview> {
  const [summary, histogram] = await Promise.all([
    getResponseTimeSummary(filters),
    getResolutionTimeHistogram(filters),
  ]);

  return { summary, histogram };
}

export async function getResponseTimeAll(
  filters: FilterState,
): Promise<{
  stats: ResolutionStatRow[];
  overdue: OverdueTicketsResult;
  summary: ResolutionSummaryStats;
  histogram: HistogramRow[];
}> {
  const [stats, overdue, summary, histogram] = await Promise.all([
    getResolutionTimeStats(filters),
    getOverdueTickets(filters, { page: 1, pageSize: 10000 }),
    getResponseTimeSummary(filters),
    getResolutionTimeHistogram(filters),
  ]);

  return { stats, overdue, summary, histogram };
}
