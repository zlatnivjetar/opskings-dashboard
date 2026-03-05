'use server';

import { sql } from 'drizzle-orm';
import { withRLS } from '@/lib/db/rls-client';
import { getUserContext } from '@/lib/auth/get-user-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketListRow = {
  id: number;
  title: string;
  typeName: string;
  priority: string;
  status: string;
  createdAt: string;
};

export type TicketListResult = {
  rows: TicketListRow[];
  totalCount: number;
  totalPages: number;
};

export type MessageRow = {
  id: number;
  fromClient: boolean;
  fromTeamMemberId: number | null;
  teamMemberName: string | null;
  messageText: string;
  createdAt: string;
};

export type FeedbackRow = {
  id: number;
  rating: number | null;
  feedbackText: string | null;
};

export type TicketDetail = {
  id: number;
  title: string;
  typeName: string;
  priority: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
};

export type TicketDetailResult = {
  ticket: TicketDetail;
  messages: MessageRow[];
  feedback: FeedbackRow | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toIso(val: unknown): string {
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getMyTickets(params?: {
  page?: number;
  pageSize?: number;
}): Promise<TicketListResult> {
  const ctx = await getUserContext();
  const { page = 1, pageSize = 20 } = params ?? {};
  const offset = (page - 1) * pageSize;

  return withRLS(ctx, async (tx) => {
    const rows = await tx.execute<{
      id: number;
      title: string;
      type_name: string;
      priority: string;
      status: string;
      created_at: unknown;
      full_count: string;
    }>(sql`
      SELECT
        t.id,
        t.title,
        tt.type_name,
        t.priority,
        t.status,
        t.created_at,
        COUNT(*) OVER() AS full_count
      FROM tickets t
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      ORDER BY t.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const totalCount = rows.length > 0 ? Number(rows[0].full_count) : 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return {
      rows: rows.map((r) => ({
        id: r.id,
        title: r.title,
        typeName: r.type_name,
        priority: r.priority,
        status: r.status,
        createdAt: toIso(r.created_at),
      })),
      totalCount,
      totalPages,
    };
  });
}

export async function getTicketDetail(
  ticketId: number,
): Promise<TicketDetailResult | null> {
  const ctx = await getUserContext();

  return withRLS(ctx, async (tx) => {
    const ticketRows = await tx.execute<{
      id: number;
      title: string;
      type_name: string;
      priority: string;
      status: string;
      created_at: unknown;
      resolved_at: unknown;
    }>(sql`
      SELECT
        t.id,
        t.title,
        tt.type_name,
        t.priority,
        t.status,
        t.created_at,
        t.resolved_at
      FROM tickets t
      JOIN ticket_types tt ON tt.id = t.ticket_type_id
      WHERE t.id = ${ticketId}
    `);

    if (ticketRows.length === 0) return null;
    const t = ticketRows[0];

    const messageRows = await tx.execute<{
      id: number;
      from_client: boolean;
      from_team_member_id: number | null;
      team_member_name: string | null;
      message_text: string;
      created_at: unknown;
    }>(sql`
      SELECT
        tm.id,
        tm.from_client,
        tm.from_team_member_id,
        mem.username AS team_member_name,
        tm.message_text,
        tm.created_at
      FROM ticket_messages tm
      LEFT JOIN team_members mem ON mem.id = tm.from_team_member_id
      WHERE tm.ticket_id = ${ticketId}
      ORDER BY tm.created_at ASC
    `);

    const feedbackRows = await tx.execute<{
      id: number;
      rating: number | null;
      feedback_text: string | null;
    }>(sql`
      SELECT id, rating, feedback_text
      FROM ticket_feedback
      WHERE ticket_id = ${ticketId}
    `);

    return {
      ticket: {
        id: t.id,
        title: t.title,
        typeName: t.type_name,
        priority: t.priority,
        status: t.status,
        createdAt: toIso(t.created_at),
        resolvedAt: t.resolved_at ? toIso(t.resolved_at) : null,
      },
      messages: messageRows.map((m) => ({
        id: m.id,
        fromClient: m.from_client,
        fromTeamMemberId: m.from_team_member_id,
        teamMemberName: m.team_member_name,
        messageText: m.message_text,
        createdAt: toIso(m.created_at),
      })),
      feedback:
        feedbackRows.length > 0
          ? {
              id: feedbackRows[0].id,
              rating: feedbackRows[0].rating,
              feedbackText: feedbackRows[0].feedback_text,
            }
          : null,
    };
  });
}

export async function createTicket(data: {
  ticketTypeId: number;
  priority: string;
  title: string;
  message: string;
}): Promise<number> {
  const ctx = await getUserContext();

  return withRLS(ctx, async (tx) => {
    const inserted = await tx.execute<{ id: number }>(sql`
      INSERT INTO tickets (client_id, ticket_type_id, priority, title, status)
      VALUES (
        ${ctx.clientId},
        ${data.ticketTypeId},
        ${data.priority},
        ${data.title},
        'open'
      )
      RETURNING id
    `);

    const ticketId = inserted[0].id;

    await tx.execute(sql`
      INSERT INTO ticket_messages (ticket_id, from_client, message_text)
      VALUES (${ticketId}, true, ${data.message})
    `);

    return ticketId;
  });
}

export async function submitFeedback(
  ticketId: number,
  rating: number,
  feedbackText: string,
): Promise<void> {
  const ctx = await getUserContext();

  await withRLS(ctx, async (tx) => {
    await tx.execute(sql`
      INSERT INTO ticket_feedback (ticket_id, rating, feedback_text)
      VALUES (${ticketId}, ${rating}, ${feedbackText})
    `);
  });
}
