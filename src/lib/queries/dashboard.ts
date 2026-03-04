'use server';

import { sql } from 'drizzle-orm';
import { adminDb } from '@/lib/db';
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
