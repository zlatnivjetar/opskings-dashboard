-- RLS-aware dashboard functions.
-- These functions set the RLS context (role + session vars) and run the query
-- in a single round-trip. Called in autocommit (no explicit transaction), so
-- BEGIN/COMMIT round-trips are eliminated. SET LOCAL applies to the implicit
-- transaction that wraps the single SELECT statement.
--
-- Run in Supabase SQL editor once, then redeploy.

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
  v_sort_col TEXT;
  v_sort_dir TEXT;
  v_offset   INT;
  v_search   TEXT;
BEGIN
  -- Whitelist sort column to prevent SQL injection
  v_sort_col := CASE p_sort_by
    WHEN 'clientName'     THEN 'c.client_name'
    WHEN 'planType'       THEN 'c.plan_type'
    WHEN 'totalTickets'   THEN 'total_tickets'
    WHEN 'openTickets'    THEN 'open_tickets'
    WHEN 'totalSpent'     THEN 'total_spent'
    WHEN 'lastTicketDate' THEN 'last_ticket_date'
    ELSE 'total_tickets'
  END;
  v_sort_dir := CASE WHEN lower(p_sort_order) = 'asc' THEN 'ASC' ELSE 'DESC' END;
  v_offset   := (p_page - 1) * p_page_size;
  v_search   := '%' || COALESCE(p_search, '') || '%';

  PERFORM set_config('app.user_id',        p_user_id,        true);
  PERFORM set_config('app.user_role',       p_user_role,      true);
  PERFORM set_config('app.client_id',       p_client_id,      true);
  PERFORM set_config('app.team_member_id',  p_team_member_id, true);
  SET LOCAL ROLE rls_user;

  RETURN QUERY EXECUTE format($q$
    SELECT
      c.id::INT,
      c.client_name::TEXT,
      c.plan_type::TEXT,
      c.status::TEXT,
      COUNT(t.id)::BIGINT                                               AS total_tickets,
      COUNT(t.id) FILTER (WHERE t.status = 'open')::BIGINT             AS open_tickets,
      SUM(p.amount_usd) FILTER (WHERE p.status = 'completed')::NUMERIC AS total_spent,
      TO_CHAR(MAX(t.created_at) AT TIME ZONE 'UTC',
              'YYYY-MM-DD"T"HH24:MI:SS"Z"')::TEXT                      AS last_ticket_date,
      COUNT(*) OVER()::BIGINT                                           AS full_count
    FROM clients c
    LEFT JOIN tickets t ON t.client_id = c.id
    LEFT JOIN payments p ON p.client_id = c.id
    WHERE ($1 = '' OR c.client_name ILIKE $2)
    GROUP BY c.id, c.client_name, c.plan_type, c.status
    ORDER BY %s %s NULLS LAST
    LIMIT $3 OFFSET $4
  $q$, v_sort_col, v_sort_dir)
  USING COALESCE(p_search, ''), v_search, p_page_size, v_offset;
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
