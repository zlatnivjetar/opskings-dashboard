-- RLS-aware dashboard functions.
-- These functions set the RLS context (role + session vars) and run the query
-- in a single round-trip. Called in autocommit (no explicit transaction), so
-- BEGIN/COMMIT round-trips are eliminated. SET LOCAL applies to the implicit
-- transaction that wraps the single SELECT statement.
--
-- Run in Supabase SQL editor once, then redeploy.
-- Milestone 9 functions (get_resolution_time_stats_rls, get_overdue_tickets_rls)
-- appended at the end of this file.

CREATE OR REPLACE FUNCTION get_dashboard_summary_rls(
  p_user_id          TEXT,
  p_user_role        TEXT,
  p_client_id        TEXT,
  p_team_member_id   TEXT,
  p_date_from        TIMESTAMPTZ DEFAULT NULL,
  p_date_to          TIMESTAMPTZ DEFAULT NULL,
  p_assigned_include INT[]       DEFAULT NULL,
  p_assigned_exclude INT[]       DEFAULT NULL,
  p_type_include     INT[]       DEFAULT NULL,
  p_type_exclude     INT[]       DEFAULT NULL,
  p_priority_include TEXT[]      DEFAULT NULL,
  p_priority_exclude TEXT[]      DEFAULT NULL
)
RETURNS TABLE (
  total_tickets        INT,
  open_tickets         INT,
  avg_resolution_hours DOUBLE PRECISION,
  avg_rating           DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.user_id',        p_user_id,        true);
  PERFORM set_config('app.user_role',       p_user_role,      true);
  PERFORM set_config('app.client_id',       p_client_id,      true);
  PERFORM set_config('app.team_member_id',  p_team_member_id, true);
  SET LOCAL ROLE rls_user;

  RETURN QUERY
  SELECT
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE t.status = 'open')::INT,
    (AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0)
      FILTER (WHERE t.resolved_at IS NOT NULL))::DOUBLE PRECISION,
    AVG(tf.rating::NUMERIC)::DOUBLE PRECISION
  FROM tickets t
  LEFT JOIN ticket_feedback tf ON t.id = tf.ticket_id
  WHERE
    (p_date_from        IS NULL OR t.created_at    >= p_date_from)
    AND (p_date_to      IS NULL OR t.created_at    <= p_date_to)
    AND (p_assigned_include IS NULL OR t.assigned_to     = ANY(p_assigned_include))
    AND (p_assigned_exclude IS NULL OR t.assigned_to    <> ALL(p_assigned_exclude))
    AND (p_type_include     IS NULL OR t.ticket_type_id  = ANY(p_type_include))
    AND (p_type_exclude     IS NULL OR t.ticket_type_id <> ALL(p_type_exclude))
    AND (p_priority_include IS NULL OR t.priority        = ANY(p_priority_include))
    AND (p_priority_exclude IS NULL OR t.priority       <> ALL(p_priority_exclude));
END;
$$;


CREATE OR REPLACE FUNCTION get_client_analysis_rls(
  p_user_id        TEXT,
  p_user_role      TEXT,
  p_client_id      TEXT,
  p_team_member_id TEXT,
  p_search         TEXT    DEFAULT '',
  p_page           INT     DEFAULT 1,
  p_page_size      INT     DEFAULT 20,
  p_sort_by        TEXT    DEFAULT 'totalTickets',
  p_sort_order     TEXT    DEFAULT 'desc'
)
RETURNS TABLE (
  id               INT,
  client_name      TEXT,
  plan_type        TEXT,
  status           TEXT,
  total_tickets    BIGINT,
  open_tickets     BIGINT,
  total_spent      NUMERIC,
  last_ticket_date TEXT,
  full_count       BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_offset  INT;
  v_search  TEXT;
  v_asc     BOOL;
BEGIN
  v_offset := (p_page - 1) * p_page_size;
  v_search := '%' || COALESCE(p_search, '') || '%';
  v_asc    := lower(p_sort_order) = 'asc';

  PERFORM set_config('app.user_id',        p_user_id,        true);
  PERFORM set_config('app.user_role',       p_user_role,      true);
  PERFORM set_config('app.client_id',       p_client_id,      true);
  PERFORM set_config('app.team_member_id',  p_team_member_id, true);
  SET LOCAL ROLE rls_user;

  -- Pre-aggregate tickets and payments separately to avoid the cross-join
  -- that occurs when both are joined directly to clients in a single query.
  -- Without CTEs the planner produces ~clients × tickets × payments rows
  -- before GROUP BY, which is ~280k rows for 50 clients.  With CTEs each
  -- table is scanned once and the final join is 50 × 50 rows.
  RETURN QUERY
  WITH ticket_stats AS (
    SELECT
      t.client_id,
      COUNT(*)                                              AS total_tickets,
      COUNT(*) FILTER (WHERE t.status = 'open')             AS open_tickets,
      MAX(t.created_at)                                     AS last_ticket_at
    FROM tickets t
    GROUP BY t.client_id
  ),
  payment_stats AS (
    SELECT
      py.client_id,
      SUM(py.amount_usd) FILTER (WHERE py.status = 'completed') AS total_spent
    FROM payments py
    GROUP BY py.client_id
  ),
  client_rows AS (
    SELECT
      c.id::INT                                                             AS id,
      c.client_name::TEXT                                                   AS client_name,
      c.plan_type::TEXT                                                     AS plan_type,
      c.status::TEXT                                                        AS status,
      COALESCE(ts.total_tickets, 0)::BIGINT                                 AS total_tickets,
      COALESCE(ts.open_tickets,  0)::BIGINT                                 AS open_tickets,
      COALESCE(ps.total_spent,   0)::NUMERIC                                AS total_spent,
      TO_CHAR(ts.last_ticket_at AT TIME ZONE 'UTC',
              'YYYY-MM-DD"T"HH24:MI:SS"Z"')::TEXT                          AS last_ticket_date
    FROM clients c
    LEFT JOIN ticket_stats  ts ON ts.client_id  = c.id
    LEFT JOIN payment_stats ps ON ps.client_id  = c.id
    WHERE (COALESCE(p_search, '') = '' OR c.client_name ILIKE v_search)
  )
  SELECT
    cr.id, cr.client_name, cr.plan_type, cr.status,
    cr.total_tickets, cr.open_tickets, cr.total_spent, cr.last_ticket_date,
    COUNT(*) OVER()::BIGINT AS full_count
  FROM client_rows cr
  ORDER BY
    CASE WHEN p_sort_by = 'clientName'     AND v_asc  THEN cr.client_name                     END ASC  NULLS LAST,
    CASE WHEN p_sort_by = 'clientName'     AND NOT v_asc THEN cr.client_name                  END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'planType'       AND v_asc  THEN cr.plan_type                       END ASC  NULLS LAST,
    CASE WHEN p_sort_by = 'planType'       AND NOT v_asc THEN cr.plan_type                    END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'totalTickets'   AND v_asc  THEN cr.total_tickets                   END ASC  NULLS LAST,
    CASE WHEN p_sort_by = 'totalTickets'   AND NOT v_asc THEN cr.total_tickets                END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'openTickets'    AND v_asc  THEN cr.open_tickets                    END ASC  NULLS LAST,
    CASE WHEN p_sort_by = 'openTickets'    AND NOT v_asc THEN cr.open_tickets                 END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'totalSpent'     AND v_asc  THEN cr.total_spent                     END ASC  NULLS LAST,
    CASE WHEN p_sort_by = 'totalSpent'     AND NOT v_asc THEN cr.total_spent                  END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'lastTicketDate' AND v_asc  THEN cr.last_ticket_date                END ASC  NULLS LAST,
    CASE WHEN p_sort_by = 'lastTicketDate' AND NOT v_asc THEN cr.last_ticket_date             END DESC NULLS LAST,
    cr.total_tickets DESC NULLS LAST
  LIMIT p_page_size OFFSET v_offset;
END;
$$;


CREATE OR REPLACE FUNCTION get_tickets_over_time_rls(
  p_user_id          TEXT,
  p_user_role        TEXT,
  p_client_id        TEXT,
  p_team_member_id   TEXT,
  p_date_from        TIMESTAMPTZ DEFAULT NULL,
  p_date_to          TIMESTAMPTZ DEFAULT NULL,
  p_assigned_include INT[]       DEFAULT NULL,
  p_assigned_exclude INT[]       DEFAULT NULL,
  p_type_include     INT[]       DEFAULT NULL,
  p_type_exclude     INT[]       DEFAULT NULL,
  p_priority_include TEXT[]      DEFAULT NULL,
  p_priority_exclude TEXT[]      DEFAULT NULL
)
RETURNS TABLE (
  month    TEXT,
  created  INT,
  resolved INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.user_id',        p_user_id,        true);
  PERFORM set_config('app.user_role',       p_user_role,      true);
  PERFORM set_config('app.client_id',       p_client_id,      true);
  PERFORM set_config('app.team_member_id',  p_team_member_id, true);
  SET LOCAL ROLE rls_user;

  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('month', t.created_at), 'YYYY-MM-01'),
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE t.resolved_at IS NOT NULL)::INT
  FROM tickets t
  WHERE
    (p_date_from        IS NULL OR t.created_at    >= p_date_from)
    AND (p_date_to      IS NULL OR t.created_at    <= p_date_to)
    AND (p_assigned_include IS NULL OR t.assigned_to     = ANY(p_assigned_include))
    AND (p_assigned_exclude IS NULL OR t.assigned_to    <> ALL(p_assigned_exclude))
    AND (p_type_include     IS NULL OR t.ticket_type_id  = ANY(p_type_include))
    AND (p_type_exclude     IS NULL OR t.ticket_type_id <> ALL(p_type_exclude))
    AND (p_priority_include IS NULL OR t.priority        = ANY(p_priority_include))
    AND (p_priority_exclude IS NULL OR t.priority       <> ALL(p_priority_exclude))
  GROUP BY DATE_TRUNC('month', t.created_at)
  ORDER BY DATE_TRUNC('month', t.created_at);
END;
$$;


-- ─── Milestone 10: Client Portal ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_ticket_detail_rls(
  p_user_id        TEXT,
  p_user_role      TEXT,
  p_client_id      TEXT,
  p_team_member_id TEXT,
  p_ticket_id      INT
)
RETURNS TABLE (
  ticket   JSON,
  messages JSON,
  feedback JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.user_id',        p_user_id,        true);
  PERFORM set_config('app.user_role',       p_user_role,      true);
  PERFORM set_config('app.client_id',       p_client_id,      true);
  PERFORM set_config('app.team_member_id',  p_team_member_id, true);
  SET LOCAL ROLE rls_user;

  RETURN QUERY
  SELECT
    (
      SELECT row_to_json(t)
      FROM (
        SELECT t.id, t.title, tt.type_name, t.priority, t.status,
               t.created_at, t.resolved_at
        FROM tickets t
        JOIN ticket_types tt ON tt.id = t.ticket_type_id
        WHERE t.id = p_ticket_id
      ) t
    ) AS ticket,
    COALESCE(
      (
        SELECT json_agg(m ORDER BY m.created_at)
        FROM (
          SELECT tm.id, tm.from_client, tm.from_team_member_id,
                 mem.username AS team_member_name,
                 tm.message_text, tm.created_at
          FROM ticket_messages tm
          LEFT JOIN team_members mem ON mem.id = tm.from_team_member_id
          WHERE tm.ticket_id = p_ticket_id
        ) m
      ),
      '[]'::json
    ) AS messages,
    (
      SELECT row_to_json(f)
      FROM (
        SELECT id, rating, feedback_text
        FROM ticket_feedback
        WHERE ticket_id = p_ticket_id
      ) f
    ) AS feedback;
END;
$$;


-- ─── Milestone 9: Response Time Analysis ─────────────────────────────────────

CREATE OR REPLACE FUNCTION get_resolution_time_stats_rls(
  p_user_id          TEXT,
  p_user_role        TEXT,
  p_client_id        TEXT,
  p_team_member_id   TEXT,
  p_date_from        TIMESTAMPTZ DEFAULT NULL,
  p_date_to          TIMESTAMPTZ DEFAULT NULL,
  p_assigned_include INT[]       DEFAULT NULL,
  p_assigned_exclude INT[]       DEFAULT NULL
)
RETURNS TABLE (
  priority       TEXT,
  min_hours      DOUBLE PRECISION,
  max_hours      DOUBLE PRECISION,
  avg_hours      DOUBLE PRECISION,
  median_hours   DOUBLE PRECISION,
  expected_hours DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('app.user_id',        p_user_id,        true);
  PERFORM set_config('app.user_role',       p_user_role,      true);
  PERFORM set_config('app.client_id',       p_client_id,      true);
  PERFORM set_config('app.team_member_id',  p_team_member_id, true);
  SET LOCAL ROLE rls_user;

  RETURN QUERY
  WITH ticket_hours AS (
    SELECT
      t.priority,
      EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0            AS actual_hours,
      tt.avg_resolution_hours::DOUBLE PRECISION                               AS type_expected_hours
    FROM tickets t
    INNER JOIN ticket_types tt ON t.ticket_type_id = tt.id
    WHERE
      t.resolved_at IS NOT NULL
      AND (p_date_from        IS NULL OR t.created_at  >= p_date_from)
      AND (p_date_to          IS NULL OR t.created_at  <= p_date_to)
      AND (p_assigned_include IS NULL OR t.assigned_to  = ANY(p_assigned_include))
      AND (p_assigned_exclude IS NULL OR t.assigned_to <> ALL(p_assigned_exclude))
  )
  SELECT
    th.priority::TEXT,
    MIN(th.actual_hours)::DOUBLE PRECISION,
    MAX(th.actual_hours)::DOUBLE PRECISION,
    AVG(th.actual_hours)::DOUBLE PRECISION,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY th.actual_hours)::DOUBLE PRECISION,
    AVG(th.type_expected_hours)::DOUBLE PRECISION
  FROM ticket_hours th
  WHERE th.priority IS NOT NULL
  GROUP BY th.priority
  ORDER BY
    CASE th.priority
      WHEN 'low'      THEN 1
      WHEN 'medium'   THEN 2
      WHEN 'high'     THEN 3
      WHEN 'critical' THEN 4
      ELSE 5
    END;
END;
$$;


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
