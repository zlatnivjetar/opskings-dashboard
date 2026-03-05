'use server';

import { sql } from 'drizzle-orm';
import { adminDb } from '@/lib/db';
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

export type ResponseTimeAll = {
  stats: ResolutionStatRow[];
  overdue: OverdueTicketsResult;
};

// ─── Server Actions ───────────────────────────────────────────────────────────

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

// Combined action — fires stats + overdue in parallel, one HTTP round-trip.
// Fetches ALL overdue rows so the client can paginate instantly.
export async function getResponseTimeAll(
  filters: FilterState,
): Promise<ResponseTimeAll> {
  const ctx = await getUserContext();
  const p = toRTParams(filters);

  const [statsRows, overdueRows] = await Promise.all([
    adminDb.execute<{
      priority: string;
      min_hours: string;
      max_hours: string;
      avg_hours: string;
      median_hours: string;
      expected_hours: string | null;
    }>(sql`
      SELECT * FROM get_resolution_time_stats_rls(
        ${ctx.userId}, ${ctx.role},
        ${ctx.clientId ? String(ctx.clientId) : ''},
        ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
        ${p.dateFrom}::timestamptz, ${p.dateTo}::timestamptz,
        ${p.assignedInclude}::int[], ${p.assignedExclude}::int[]
      )
    `),
    adminDb.execute<{
      ticket_id: number;
      title: string;
      client_name: string;
      type_name: string;
      priority: string;
      actual_hours: string;
      expected_hours: string;
      excess_hours: string;
      full_count: string;
    }>(sql`
      SELECT * FROM get_overdue_tickets_rls(
        ${ctx.userId}, ${ctx.role},
        ${ctx.clientId ? String(ctx.clientId) : ''},
        ${ctx.teamMemberId ? String(ctx.teamMemberId) : ''},
        ${p.dateFrom}::timestamptz, ${p.dateTo}::timestamptz,
        ${p.assignedInclude}::int[], ${p.assignedExclude}::int[],
        ${1}, ${10000}
      )
    `),
  ]);

  return {
    stats: statsRows.map((r) => ({
      priority: r.priority,
      minHours: Number(r.min_hours),
      maxHours: Number(r.max_hours),
      avgHours: Number(r.avg_hours),
      medianHours: Number(r.median_hours),
      expectedHours: r.expected_hours != null ? Number(r.expected_hours) : 0,
    })),
    overdue: {
      rows: overdueRows.map((r) => ({
        ticketId: Number(r.ticket_id),
        title: r.title,
        clientName: r.client_name,
        typeName: r.type_name,
        priority: r.priority,
        actualHours: Number(r.actual_hours),
        expectedHours: Number(r.expected_hours),
        excessHours: Number(r.excess_hours),
      })),
      totalCount: overdueRows.length,
      totalPages: 1,
    },
  };
}
