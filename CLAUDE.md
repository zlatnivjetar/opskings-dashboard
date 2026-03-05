# Current Milestone: 12

## Completed

- [x] Milestone 0: Project Setup
- [x] Milestone 1: Drizzle Schema + Database Indexes
- [x] Milestone 2: BetterAuth Setup + User Schema
- [x] Milestone 3: RLS Policies + Database Role Setup
- [x] Milestone 4: Shared Filter System
- [x] Milestone 5: Dashboard Overview Cards + Tickets Over Time
- [x] Milestone 6: Team Performance Table
- [x] Milestone 7: Distribution Charts
- [x] Milestone 8: Client Analysis View
- [x] Milestone 9: Response Time Analysis
- [x] Milestone 10: Client Portal
- [x] Milestone 11: Performance Optimization + Testing

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

- `getTeamPerformance()` server action in `src/lib/queries/team.ts` — uses `withRLS()`; single query LEFT JOINing `team_members → tickets → ticket_feedback`; returns all 15 members including those with 0 tickets
- `TeamPerformanceTable` client component at `src/components/dashboard/TeamPerformanceTable.tsx` — TanStack Table (`@tanstack/react-table`) with client-side sort + filter; custom `numberRangeFilter` FilterFn with `autoRemove` guard (`!Array.isArray(val)` needed — TanStack Table calls `autoRemove` with `undefined` when clearing, causing destructure crash without the guard)
- Top performer computed client-side: highest resolution rate + rating ≥ average; green row tint + badge

- `getTicketsByType` and `getTicketsByPriority` server actions in `src/lib/queries/dashboard.ts` — use `withRLS()` + Drizzle ORM queries (not stored functions); strip `ticketType` and `priority` from FilterState before applying so charts always show full distribution scoped only by date + team member
- `FilterBar` accepts an optional `allowedFilters?: FilterKey[]` prop — pass `['date', 'teamMember']` on distribution page to restrict available filters in the UI
- Recharts tooltip `contentStyle.background` must use a literal hex (`#ffffff`) not a CSS variable — CSS variables don't resolve inside Recharts' tooltip DOM (rendered outside component tree)
- `TicketsByTypeChart` at `src/components/charts/TicketsByTypeChart.tsx` — Recharts PieChart donut; 14-color palette; percentage labels rendered via `any`-typed custom label function (Recharts `PieLabelRenderProps` doesn't include `percentage` in its type despite passing it at runtime)
- `TicketsByPriorityChart` at `src/components/charts/TicketsByPriorityChart.tsx` — stacked BarChart; priority order enforced via `CASE` in SQL ORDER BY; open=red/in_progress=yellow/resolved=green
- Distribution page at `src/app/dashboard/distribution/page.tsx` — client component following same `Inner` + outer `<Suspense>` pattern as DashboardContent

- `getClientAnalysis()` server action in `src/lib/queries/clients.ts` — calls `get_client_analysis_rls()` stored function via `adminDb.execute()` (not `withRLS`); RLS enforcement is inside the function; accepts search, page, pageSize, sortBy, sortOrder params
- `get_client_analysis_rls()` in `database/rls-functions.sql` — uses `EXECUTE format()` with `USING` clause for dynamic ORDER BY (sort column whitelisted via `CASE`); returns `full_count` via `COUNT(*) OVER()` window function so count + data arrive in one query; `last_ticket_date` cast to TEXT via `TO_CHAR(..., 'YYYY-MM-DD"T"HH24:MI:SS"Z"')` to guarantee ISO string across postgres.js versions
- `ClientAnalysisTable` at `src/components/dashboard/ClientAnalysisTable.tsx` — local state for search/page/sort (no URL sync); `keepPreviousData` from TanStack Query eliminates skeleton flash on param changes; `isFetching && !isLoading` drives opacity fade instead
- Clients page at `src/app/dashboard/clients/page.tsx` — server component; role-guards with `getUserContext()` + `redirect('/portal')` before rendering the client component

- `getResolutionTimeStats()` and `getOverdueTickets()` server actions in `src/lib/queries/response-time.ts` — call `get_resolution_time_stats_rls` and `get_overdue_tickets_rls` via `adminDb.execute()` (RLS inside function); accept date + teamMember filters only (no ticketType/priority — those are the dimensions being measured)
- `expected_hours` in stats = `AVG(ticket_types.avg_resolution_hours)` for resolved tickets in each priority bucket (not a fixed lookup — it averages whatever type benchmarks land in that priority group)
- `get_overdue_tickets_rls` uses `COUNT(*) OVER()` window function for `full_count` — pagination + total in one query, same pattern as `get_client_analysis_rls`
- `ResponseTimeContent` client component at `src/components/dashboard/ResponseTimeContent.tsx` — contains all 'use client' logic; page.tsx is a server component that role-guards then renders it (same split as clients page)
- `OverdueTicketsTable` receives `filters` as a prop and resets `page` state to 1 via `useEffect` when filters change

- Portal server actions in `src/lib/queries/portal.ts` — all 4 actions (`getMyTickets`, `getTicketDetail`, `createTicket`, `submitFeedback`) use `withRLS()`; `createTicket` inserts ticket + first message in the same transaction; `clientId` is always taken from session context, never user input
- `getTicketDetail` fetches ticket, messages (with team member names), and feedback in 3 sequential queries inside a single `withRLS` transaction — RLS on tickets table enforces client can only see their own ticket
- Portal layout (`src/app/portal/layout.tsx`) is a server component — checks role, redirects `team_member` to `/dashboard`, fetches email for header display; middleware also enforces this at the Edge
- Client components in `src/components/portal/`: `SignOutButton` (authClient.signOut + router.push), `NewTicketForm` (calls createTicket, router.push on success), `FeedbackForm` (calls submitFeedback, router.refresh on success)
- `src/components/ui/textarea.tsx` added (was missing from original shadcn install)
- Ticket detail page uses `router.refresh()` after feedback submission so the server component re-fetches and hides the form without a full navigation

- `get_client_analysis_rls()` rewritten with CTE pre-aggregation (ticket_stats + payment_stats CTEs) — eliminates the n_tickets × n_payments cross-join that produced 283k rows; static SQL replaces `EXECUTE FORMAT` enabling plan caching; function deployed to Supabase
- Next.js serialises concurrent server action calls per page — never use two separate `useQuery` calls for data needed on the same render; instead use a combined server action with `Promise.all` and a single `useQuery`
- Combined actions: `getDashboardAll` (summary + ticketsOverTime), `getDistributionAll` (byType + byPriority), `getResponseTimeAll(filters, page, pageSize)` (stats + overdue) — all in `src/lib/queries/dashboard.ts` and `src/lib/queries/response-time.ts`
- `OverdueTicketsTable` now receives data as props (rows, totalCount, totalPages, page, onPageChange, isLoading, isFetching) — query and page state owned by `ResponseTimeContent`
- `scripts/` excluded from tsconfig `exclude` array — prevents Next.js build from type-checking benchmark/seed scripts
- Performance results and E2E browser timings documented in `docs/performance-results.md`; benchmark script at `scripts/benchmark.ts`

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
