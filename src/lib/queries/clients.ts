'use server';

import { sql } from 'drizzle-orm';
import { adminDb } from '@/lib/db';
import { getUserContext } from '@/lib/auth/get-user-context';

export type ClientAnalysisRow = {
  id: number;
  clientName: string;
  planType: string;
  status: string;
  totalTickets: number;
  openTickets: number;
  totalSpent: number | null;
  lastTicketDate: string | null;
};

export type ClientAnalysisResult = {
  rows: ClientAnalysisRow[];
  totalCount: number;
  totalPages: number;
};

export type SortableColumn =
  | 'clientName'
  | 'planType'
  | 'totalTickets'
  | 'openTickets'
  | 'totalSpent'
  | 'lastTicketDate';

export type ClientAnalysisParams = {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortableColumn;
  sortOrder?: 'asc' | 'desc';
};

export async function getClientAnalysis(
  params?: ClientAnalysisParams,
): Promise<ClientAnalysisResult> {
  const ctx = await getUserContext();
  const {
    search = '',
    page = 1,
    pageSize = 20,
    sortBy = 'totalTickets',
    sortOrder = 'desc',
  } = params ?? {};

  const clientId = ctx.clientId ? String(ctx.clientId) : '';
  const teamMemberId = ctx.teamMemberId ? String(ctx.teamMemberId) : '';

  const rows = await adminDb.execute<{
    id: number;
    client_name: string;
    plan_type: string;
    status: string;
    total_tickets: string;
    open_tickets: string;
    total_spent: string | null;
    last_ticket_date: string | null;
    full_count: string;
  }>(sql`
    SELECT * FROM get_client_analysis_rls(
      ${ctx.userId},
      ${ctx.role},
      ${clientId},
      ${teamMemberId},
      ${search},
      ${page},
      ${pageSize},
      ${sortBy},
      ${sortOrder}
    )
  `);

  const totalCount = rows.length > 0 ? Number(rows[0].full_count) : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    rows: rows.map((r) => ({
      id: r.id,
      clientName: r.client_name,
      planType: r.plan_type,
      status: r.status,
      totalTickets: Number(r.total_tickets),
      openTickets: Number(r.open_tickets),
      totalSpent: r.total_spent != null ? Number(r.total_spent) : null,
      lastTicketDate: r.last_ticket_date ?? null,
    })),
    totalCount,
    totalPages,
  };
}
