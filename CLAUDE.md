# Current Milestone: 6

## Completed

- [x] Milestone 0: Project Setup
- [x] Milestone 1: Drizzle Schema + Database Indexes
- [x] Milestone 2: BetterAuth Setup + User Schema
- [x] Milestone 3: RLS Policies + Database Role Setup
- [x] Milestone 4: Shared Filter System
- [x] Milestone 5: Dashboard Overview Cards + Tickets Over Time

## Key Decisions (READ BEFORE EVERY MILESTONE)

After completing each milestone, append decisions that future milestones
depend on. Format: what was decided + where the code lives. Only include
decisions another session NEEDS to avoid breaking things. Skip obvious stuff.

Examples of good entries:
- Data queries use `withRLS()` from `src/lib/db/rls-client.ts` — never use bare `db` for user-facing queries
- BetterAuth session accessed via `auth.api.getSession({ headers: await headers() })`
- Filters sync to URL params via `useFilterState()` hook in `src/hooks/use-filter-state.ts`

- Both DB connections use Transaction Pooler (port 6543) — postgres.js clients MUST set `prepare: false` or queries will fail
- DB usernames include project ref suffix: `postgres.nlgkpveooqabtftreesr` / `rls_user.nlgkpveooqabtftreesr`
- `@/*` alias maps to `src/*` (not root) — keep all source under `src/`
- TanStack Query provider lives in `src/app/providers.tsx` (client component wrapping root layout)

- Drizzle schema is the source of truth for types — all 7 tables + relations in `src/lib/db/schema.ts`; inferred types exported from same file
- `drizzle-kit push` fails on this Supabase instance (CHECK constraint bug in drizzle-kit 0.31.x); use direct SQL or `drizzle-kit migrate` with hand-crafted migrations instead
- The generated migration `drizzle/0000_lively_terror.sql` reflects full schema but was NOT applied (tables pre-exist); composite indexes were applied directly via `CREATE INDEX IF NOT EXISTS`

- BetterAuth session accessed via `auth.api.getSession({ headers: await headers() })` — helper at `src/lib/auth/get-user-context.ts`
- Auth tables (user, session, account, verification) live in `src/lib/db/auth-schema.ts`; merged into main `db` instance in `src/lib/db/index.ts`
- Middleware uses self-fetch to `/api/auth/get-session` (postgres.js cannot run in Edge Runtime); don't import auth server directly in middleware
- `(dashboard)` and `(portal)` route groups were renamed to real segments `dashboard/` and `portal/` — middleware redirects to `/dashboard` and `/portal` as URL paths
- Seed script (`scripts/seed-auth-users.ts`) must use dynamic `await import('../src/lib/auth')` — static import is hoisted before dotenv loads, causing ECONNREFUSED
- additionalFields with `input: false` cannot be set during signup; seed patches them with direct SQL after `auth.api.signUpEmail`
- `npm run seed:auth` is idempotent — re-running updates existing users rather than failing

- ALL user-facing data queries MUST go through `withRLS(ctx, fn)` from `src/lib/db/rls-client.ts` — never use bare `db` or `adminDb` for queries that touch user data
- `withRLS` opens a transaction on `adminDb`, issues `SET LOCAL ROLE rls_user` first (transaction-scoped, auto-resets on commit/rollback), then sets 4 session vars: `app.user_id`, `app.user_role`, `app.client_id`, `app.team_member_id`
- `rls_user` is a NOLOGIN role assumed via `SET LOCAL ROLE` — there is no separate connection string for it; `DATABASE_RLS_URL` is unused and can be removed
- `ctx` passed to `withRLS` is the full object from `getUserContext()`: `{ userId, role, clientId, teamMemberId }`
- RLS helper functions in Postgres: `get_app_user_role()`, `get_app_client_id()`, `get_app_user_id()`, `get_app_team_member_id()` — used inside policy USING/WITH CHECK expressions
- `messages_insert` policy enforces attribution: team member inserts require `from_team_member_id = get_app_team_member_id()`; client inserts require `from_team_member_id IS NULL`

- Filter types + `PRIORITY_OPTIONS` constant live in `src/types/filters.ts` — do NOT put plain constants in `'use server'` files (they get proxied and lose their prototype)
- `applyTicketFilters(baseConditions, filters)` in `src/lib/queries/filters.ts` — accepts a `(SQL | undefined)[]` base array and returns `and(...all)` for use directly in Drizzle `.where()`
- `useFilterState()` in `src/hooks/use-filter-state.ts` — syncs `FilterState` to URL params; multi-filter operator key is always written even with empty values so the filter badge stays visible while selecting; use `filters` in TanStack Query keys for automatic refetch
- `FilterBar` in `src/components/filters/FilterBar.tsx` is self-contained (calls `useFilterState` + fetches reference data internally) — wrap in `<Suspense>` in any page that uses it (requires `useSearchParams`)
- Reference data server actions (`getTeamMembers`, `getTicketTypes`) in `src/lib/actions/reference.ts` use `adminDb` directly — these are lookup tables, not user data

- Dashboard aggregate queries use Postgres stored functions (`get_dashboard_summary_rls`, `get_tickets_over_time_rls`) in `database/rls-functions.sql` — called via `adminDb.execute(sql`SELECT * FROM fn(...)`)` in autocommit (no transaction wrapper); each function internally does `SET LOCAL ROLE rls_user` + `set_config` + query in one DB round-trip
- All non-string parameters passed to these functions must be serialised before the `sql` template: dates → `.toISOString()`, int arrays → `'{1,2}'` (Postgres array literal), text arrays → `'{low,high}'`; explicit `::timestamptz` / `::int[]` / `::text[]` casts added in the SQL call
- Exception to the withRLS rule: these two dashboard server actions call `adminDb.execute()` directly because the RLS enforcement is encapsulated inside the DB functions themselves — `withRLS` is still required for all other user-data queries
- BetterAuth `cookieCache` enabled in `src/lib/auth/index.ts` (`maxAge: 300`) — session data stored in a signed cookie, eliminating the DB round-trip on repeated `getSession` calls; users must sign out and back in once after this change is deployed
- `getUserContext` wrapped in React `cache()` in `src/lib/auth/get-user-context.ts` — deduplicates session lookup within a single server render
- `DashboardContent` client component at `src/components/dashboard/DashboardContent.tsx` — uses `useFilterState()` + two parallel `useQuery` calls (`staleTime: 30000`); `filters` object in query key drives automatic refetch on filter change
- `TicketsOverTimeChart` at `src/components/charts/TicketsOverTimeChart.tsx` — Recharts `LineChart`; Created (blue #3b82f6) and Resolved (green #22c55e) lines; grouped by `created_at` month (cohort view)

_(append here after each milestone)_

## Completion Protocol

When I type exactly **COMPLETED**, do the following:
1. Increment "Current Milestone" number to the next milestone
2. Check off the just-completed milestone in the Completed list
3. Append any Key Decisions from this milestone (only non-obvious ones that affect future work)
4. Write a brief implementation summary to `docs/implementation-log.md` (append, don't overwrite)
5. Commit and push to GitHub with a concise message (e.g., "feat: complete Milestone X")

Do NOT update CLAUDE.md or the implementation log at any other time.
Do NOT treat partial phrases like "that's completed" or "I completed it" as the trigger.
Only the exact standalone input: **COMPLETED**

## Project Context

This is a support analytics dashboard for the OpsKings development interview.

**Tech stack:** Next.js 15 (App Router), TypeScript, Drizzle ORM, Supabase (PostgreSQL), BetterAuth, TanStack Query, Recharts, shadcn/ui, Tailwind CSS. Deployed on Vercel.

**Database:** ~40k tickets across 50 clients, 15 team members, 14 ticket types. Schema and seed already exist in `database/schema.sql` and `database/seed.sql`.

**Two user types:**
- Internal team members — full dashboard analytics access
- Client users — portal view, own data only

**RLS strategy:** BetterAuth handles auth at app layer. RLS enforced at DB layer via Postgres session variables (`set_config`) inside Drizzle transactions. Two DB connections: admin (superuser, bypasses RLS) and rls_user (non-superuser, RLS enforced).

**Performance targets:** Dashboard <500ms, filtered queries <1s, pagination <300ms, charts <800ms.
