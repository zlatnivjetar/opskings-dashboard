'use server';

import { sql } from 'drizzle-orm';
import { withRLS } from '@/lib/db/rls-client';
import { getUserContext } from '@/lib/auth/get-user-context';

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

export async function getTeamPerformance(): Promise<TeamPerformanceRow[]> {
  const ctx = await getUserContext();

  return withRLS(ctx, async (tx) => {
    const rows = await tx.execute<{
      id: number;
      username: string;
      department: string;
      status: string;
      assigned: string;
      resolved: string;
      resolution_rate: string | null;
      avg_resolution_hours: string | null;
      avg_rating: string | null;
    }>(sql`
      SELECT
        tm.id,
        tm.username,
        tm.department,
        tm.status,
        COUNT(t.id) AS assigned,
        COUNT(t.id) FILTER (WHERE t.status = 'resolved') AS resolved,
        CASE
          WHEN COUNT(t.id) > 0 THEN
            ROUND(
              COUNT(t.id) FILTER (WHERE t.status = 'resolved')::numeric
              / COUNT(t.id) * 100,
              1
            )
          ELSE NULL
        END AS resolution_rate,
        AVG(
          EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0
        ) FILTER (WHERE t.resolved_at IS NOT NULL) AS avg_resolution_hours,
        AVG(tf.rating) AS avg_rating
      FROM team_members tm
      LEFT JOIN tickets t ON t.assigned_to = tm.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      GROUP BY tm.id, tm.username, tm.department, tm.status
      ORDER BY tm.username
    `);

    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      department: r.department,
      status: r.status,
      assigned: Number(r.assigned),
      resolved: Number(r.resolved),
      resolutionRate: r.resolution_rate != null ? Number(r.resolution_rate) : null,
      avgResolutionHours:
        r.avg_resolution_hours != null ? Number(r.avg_resolution_hours) : null,
      avgRating: r.avg_rating != null ? Number(r.avg_rating) : null,
    }));
  });
}
