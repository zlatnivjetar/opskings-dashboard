/**
 * Deploys the updated get_overdue_tickets_rls function to Supabase.
 * Adds the created_at column to the return type.
 * Run with: npx tsx scripts/deploy-rt-function.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });

  await client.unsafe(`DROP FUNCTION IF EXISTS get_overdue_tickets_rls(text,text,text,text,timestamptz,timestamptz,int[],int[],int,int);`);
  console.log('Dropped old function.');

  await client.unsafe(`
CREATE OR REPLACE FUNCTION get_overdue_tickets_rls(
  p_user_id          TEXT,
  p_user_role        TEXT,
  p_client_id        TEXT,
  p_team_member_id   TEXT,
  p_date_from        TIMESTAMPTZ DEFAULT NULL,
  p_date_to          TIMESTAMPTZ DEFAULT NULL,
  p_assigned_include INT[]       DEFAULT NULL,
  p_assigned_exclude INT[]       DEFAULT NULL,
  p_page             INT         DEFAULT 1,
  p_page_size        INT         DEFAULT 20
)
RETURNS TABLE (
  ticket_id      INT,
  title          TEXT,
  client_name    TEXT,
  created_at     TEXT,
  type_name      TEXT,
  priority       TEXT,
  actual_hours   DOUBLE PRECISION,
  expected_hours DOUBLE PRECISION,
  excess_hours   DOUBLE PRECISION,
  full_count     BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset INT;
BEGIN
  PERFORM set_config('app.user_id',        p_user_id,        true);
  PERFORM set_config('app.user_role',       p_user_role,      true);
  PERFORM set_config('app.client_id',       p_client_id,      true);
  PERFORM set_config('app.team_member_id',  p_team_member_id, true);
  SET LOCAL ROLE rls_user;

  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  SELECT
    t.id::INT,
    t.title::TEXT,
    c.client_name::TEXT,
    TO_CHAR(t.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')::TEXT AS created_at,
    tt.type_name::TEXT,
    t.priority::TEXT,
    (EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0)::DOUBLE PRECISION  AS actual_hours,
    tt.avg_resolution_hours::DOUBLE PRECISION                                          AS expected_hours,
    (EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0
      - tt.avg_resolution_hours)::DOUBLE PRECISION                                    AS excess_hours,
    COUNT(*) OVER()::BIGINT                                                            AS full_count
  FROM tickets t
  INNER JOIN clients c      ON t.client_id      = c.id
  INNER JOIN ticket_types tt ON t.ticket_type_id = tt.id
  WHERE
    t.resolved_at IS NOT NULL
    AND tt.avg_resolution_hours IS NOT NULL
    AND EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0 > tt.avg_resolution_hours
    AND (p_date_from        IS NULL OR t.created_at  >= p_date_from)
    AND (p_date_to          IS NULL OR t.created_at  <= p_date_to)
    AND (p_assigned_include IS NULL OR t.assigned_to  = ANY(p_assigned_include))
    AND (p_assigned_exclude IS NULL OR t.assigned_to <> ALL(p_assigned_exclude))
  ORDER BY excess_hours DESC
  LIMIT p_page_size OFFSET v_offset;
END;
$$;
`);

  await client.end();
  console.log('Done: get_overdue_tickets_rls deployed with created_at column.');
}

main().catch((e) => { console.error(e); process.exit(1); });
