-- RLS Setup: role, helper functions, and policies.
-- Run this in the Supabase SQL Editor AFTER schema.sql and seed.sql,
-- but BEFORE rls-functions.sql.

-- ─── 1. Create the rls_user role ─────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_user') THEN
    CREATE ROLE rls_user NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;

-- Allow the superuser connection to assume rls_user via SET ROLE
GRANT rls_user TO postgres;

-- Grant table access
GRANT USAGE ON SCHEMA public TO rls_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO rls_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rls_user;

-- Ensure future tables also get grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO rls_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO rls_user;


-- ─── 2. Session variable helper functions ────────────────────────────────────
-- These are called inside RLS policy expressions to read the session vars
-- set by withRLS() or the stored functions in rls-functions.sql.

CREATE OR REPLACE FUNCTION get_app_user_id() RETURNS TEXT
  LANGUAGE sql STABLE
  AS $$ SELECT current_setting('app.user_id', true) $$;

CREATE OR REPLACE FUNCTION get_app_user_role() RETURNS TEXT
  LANGUAGE sql STABLE
  AS $$ SELECT current_setting('app.user_role', true) $$;

CREATE OR REPLACE FUNCTION get_app_client_id() RETURNS TEXT
  LANGUAGE sql STABLE
  AS $$ SELECT current_setting('app.client_id', true) $$;

CREATE OR REPLACE FUNCTION get_app_team_member_id() RETURNS TEXT
  LANGUAGE sql STABLE
  AS $$ SELECT current_setting('app.team_member_id', true) $$;


-- ─── 3. Enable RLS on all 7 tables ──────────────────────────────────────────

ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_feedback  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;

ALTER TABLE clients          FORCE ROW LEVEL SECURITY;
ALTER TABLE team_members     FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_types     FORCE ROW LEVEL SECURITY;
ALTER TABLE tickets          FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages  FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_feedback  FORCE ROW LEVEL SECURITY;
ALTER TABLE payments         FORCE ROW LEVEL SECURITY;


-- ─── 4. RLS Policies ────────────────────────────────────────────────────────
-- Access matrix:
--   team_member: full read on everything, insert messages attributed to self
--   client:      own data only, insert messages without team_member attribution

-- Drop existing policies (idempotent re-runs)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END
$$;

-- ── clients ──────────────────────────────────────────────────────────────────
-- Team members see all clients; clients see only their own record.
CREATE POLICY clients_select ON clients FOR SELECT USING (
  get_app_user_role() = 'team_member'
  OR id = NULLIF(get_app_client_id(), '')::INT
);

-- ── team_members ─────────────────────────────────────────────────────────────
-- Both roles can read team member info (public directory).
CREATE POLICY team_members_select ON team_members FOR SELECT USING (true);

-- ── ticket_types ─────────────────────────────────────────────────────────────
-- Both roles can read ticket types (reference data).
CREATE POLICY ticket_types_select ON ticket_types FOR SELECT USING (true);

-- ── tickets ──────────────────────────────────────────────────────────────────
-- Team members see all tickets; clients see only their own.
CREATE POLICY tickets_select ON tickets FOR SELECT USING (
  get_app_user_role() = 'team_member'
  OR client_id = NULLIF(get_app_client_id(), '')::INT
);

-- Clients can create tickets for themselves only.
CREATE POLICY tickets_insert ON tickets FOR INSERT WITH CHECK (
  get_app_user_role() = 'client'
  AND client_id = NULLIF(get_app_client_id(), '')::INT
);

-- ── ticket_messages ──────────────────────────────────────────────────────────
-- Team members see all messages; clients see messages on their own tickets.
CREATE POLICY messages_select ON ticket_messages FOR SELECT USING (
  get_app_user_role() = 'team_member'
  OR ticket_id IN (
    SELECT id FROM tickets WHERE client_id = NULLIF(get_app_client_id(), '')::INT
  )
);

-- Insert with anti-spoofing:
--   team_member must set from_team_member_id to their own ID
--   client must leave from_team_member_id NULL
CREATE POLICY messages_insert ON ticket_messages FOR INSERT WITH CHECK (
  (
    get_app_user_role() = 'team_member'
    AND from_team_member_id = NULLIF(get_app_team_member_id(), '')::INT
  )
  OR (
    get_app_user_role() = 'client'
    AND from_team_member_id IS NULL
    AND ticket_id IN (
      SELECT id FROM tickets WHERE client_id = NULLIF(get_app_client_id(), '')::INT
    )
  )
);

-- ── ticket_feedback ──────────────────────────────────────────────────────────
-- Team members see all feedback; clients see feedback on their own tickets.
CREATE POLICY feedback_select ON ticket_feedback FOR SELECT USING (
  get_app_user_role() = 'team_member'
  OR ticket_id IN (
    SELECT id FROM tickets WHERE client_id = NULLIF(get_app_client_id(), '')::INT
  )
);

-- Clients can submit feedback on their own resolved tickets.
CREATE POLICY feedback_insert ON ticket_feedback FOR INSERT WITH CHECK (
  get_app_user_role() = 'client'
  AND ticket_id IN (
    SELECT id FROM tickets WHERE client_id = NULLIF(get_app_client_id(), '')::INT
  )
);

-- ── payments ─────────────────────────────────────────────────────────────────
-- Team members see all payments; clients see only their own.
CREATE POLICY payments_select ON payments FOR SELECT USING (
  get_app_user_role() = 'team_member'
  OR client_id = NULLIF(get_app_client_id(), '')::INT
);
