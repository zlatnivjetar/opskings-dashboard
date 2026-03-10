# Architecture Decisions

Full reference for non-obvious decisions made during development. Consult this before touching an unfamiliar area of the codebase.

---

## Database & ORM

- Both DB connections use Transaction Pooler (port 6543) — postgres.js clients MUST set `prepare: false` or queries will fail
- DB usernames include project ref suffix: `postgres.nlgkpveooqabtftreesr` / `rls_user.nlgkpveooqabtftreesr`
- Drizzle schema is the source of truth for types — all 7 tables + relations in `src/lib/db/schema.ts`; inferred types exported from same file
- `drizzle-kit push` fails on this Supabase instance (CHECK constraint bug in drizzle-kit 0.31.x) — use direct SQL or `drizzle-kit migrate` with hand-crafted migrations
- The generated migration `drizzle/0000_lively_terror.sql` reflects full schema but was NOT applied (tables pre-exist); composite indexes were applied directly via `CREATE INDEX IF NOT EXISTS`

## RLS & Auth

- ALL user-facing data queries MUST go through `withRLS(ctx, fn)` from `src/lib/db/rls-client.ts` — never use bare `db` or `adminDb` for queries that touch user data
- `withRLS` opens a transaction on `adminDb`, issues `SET LOCAL ROLE rls_user` first (transaction-scoped, auto-resets on commit/rollback), then sets 4 session vars: `app.user_id`, `app.user_role`, `app.client_id`, `app.team_member_id`
- `rls_user` is a NOLOGIN role assumed via `SET LOCAL ROLE` — there is no separate connection string for it
- `ctx` passed to `withRLS` is the full object from `getUserContext()`: `{ userId, role, clientId, teamMemberId }`
- RLS helper functions in Postgres: `get_app_user_role()`, `get_app_client_id()`, `get_app_user_id()`, `get_app_team_member_id()` — used inside policy USING/WITH CHECK expressions
- `messages_insert` policy enforces attribution: team member inserts require `from_team_member_id = get_app_team_member_id()`; client inserts require `from_team_member_id IS NULL`
- BetterAuth session accessed via `auth.api.getSession({ headers: await headers() })` — helper at `src/lib/auth/get-user-context.ts`
- `getUserContext` wrapped in React `cache()` — deduplicates session lookup within a single server render
- BetterAuth `cookieCache` enabled (`maxAge: 300`) — session stored in a signed cookie, eliminating the DB round-trip on repeated `getSession` calls
- Auth tables (user, session, account, verification) live in `src/lib/db/auth-schema.ts`; merged into main `db` instance in `src/lib/db/index.ts`
- Middleware uses self-fetch to `/api/auth/get-session` — postgres.js cannot run in Edge Runtime; don't import auth server directly in middleware
- Seed script (`scripts/seed-auth-users.ts`) must use dynamic `await import('../src/lib/auth')` — static import is hoisted before dotenv loads, causing ECONNREFUSED
- `additionalFields` with `input: false` cannot be set during signup; seed patches them with direct SQL after `auth.api.signUpEmail`
- `npm run seed:auth` is idempotent — re-running updates existing users rather than failing
- Test credentials: `john@company.com` / `password123` (team_member), `admin@techstart.com` / `password123` (client)

## Stored Functions & Query Patterns

- Dashboard aggregate queries use Postgres stored functions (`get_dashboard_summary_rls`, `get_tickets_over_time_rls`) in `database/rls-functions.sql` — called via `adminDb.execute()` in autocommit; each function internally does `SET LOCAL ROLE rls_user` + `set_config`
- Exception to the `withRLS` rule: server actions that call stored functions use `adminDb.execute()` directly — RLS enforcement is inside the DB function
- All non-string parameters passed to stored functions must be serialised before the `sql` template: dates → `.toISOString()`, int arrays → `'{1,2}'`, text arrays → `'{low,high}'`; explicit `::timestamptz` / `::int[]` / `::text[]` casts in the SQL call
- Next.js serialises concurrent server action calls per page — never use two separate `useQuery` calls for data on the same render; use a combined server action with `Promise.all` and a single `useQuery`
- Combined actions: `getDashboardAllWithComparison` (summary + ticketsOverTime + byType + byPriority + previousSummary), `getResponseTimeAll` (stats + overdue + histogram) — in `src/lib/queries/dashboard.ts` and `src/lib/queries/response-time.ts`
- `get_client_analysis_rls()` uses CTE pre-aggregation (ticket_stats + payment_stats) — eliminates cross-join; static SQL enables plan caching
- `get_client_analysis_rls()` and `get_overdue_tickets_rls()` use `COUNT(*) OVER()` window function for `full_count` — pagination + total in one query

## Filters

- Filter types + `PRIORITY_OPTIONS` constant live in `src/types/filters.ts` — do NOT put plain constants in `'use server'` files (they get proxied and lose their prototype)
- `applyTicketFilters(baseConditions, filters)` in `src/lib/queries/filters.ts` — accepts a `(SQL | undefined)[]` base array and returns `and(...all)` for use directly in Drizzle `.where()`
- `useFilterState()` in `src/hooks/use-filter-state.ts` — syncs `FilterState` to URL params; use `filters` in TanStack Query keys for automatic refetch
- `FilterBar` in `src/components/filters/FilterBar.tsx` is self-contained — wrap in `<Suspense>` in any page that uses it (requires `useSearchParams`)
- `FilterBar` accepts `allowedFilters?: FilterKey[]` prop to restrict which filters are shown
- Reference data server actions (`getTeamMembers`, `getTicketTypes`) in `src/lib/actions/reference.ts` use `adminDb` directly — lookup tables, not user data

## Charts & Theme

- Recharts SVG `fill`/`stroke` does NOT support CSS `oklch()` — use `useChartTheme()` from `src/hooks/use-chart-theme.ts`; never pass `var(--...)` directly to Recharts props
- Recharts tooltip `contentStyle.background` must be a hex literal — CSS variables don't resolve in Recharts' out-of-tree tooltip DOM
- `useChartTheme()` returns hex color map per resolved theme; includes `tooltipBg`, `tooltipBorder`, `tooltipText`, `grid`, `axis`, per-priority colors, and 6 chart palette colors
- `chartPalette(colors, n)` and `priorityColor(colors, priority)` exported from `src/hooks/use-chart-theme.ts`
- `tooltipStyle(colors)` in `src/components/charts/ChartTooltip.tsx` — returns `CSSProperties` for Recharts `Tooltip contentStyle`
- `ChartTabs` at `src/components/charts/ChartTabs.tsx` — segmented control used by all chart components for view/filter/granularity toggles

## UI Components & Patterns

- `ThemeProvider` lives in `src/app/providers.tsx`; `defaultTheme="dark"`, `attribute="class"`
- `ThemeToggle` requires a `mounted` state guard before rendering the icon — `resolvedTheme` is `undefined` on server
- `SidebarNav` is a client component — never pass Lucide icon components as props from `Sidebar.tsx` (server); icons defined entirely in `SidebarNav.tsx`, server passes only `role: string`
- `MotionMain` client component at `src/components/layout/MotionMain.tsx` — wraps `<main>` with `AnimatePresence mode="wait"` keyed on `usePathname()`; RSC can safely pass `children` as opaque nodes
- `SidebarNav` uses `LayoutGroup id="sidebar-nav"` + `motion.span layoutId="active-bg"` for animated active state
- `KpiCard` at `src/components/dashboard/KpiCard.tsx` — `'use client'`; props: `label`, `value`, `subtitle?`, `trend?`, `positiveIsGood?`, `delay?`; when `positiveIsGood=false` trend colors invert
- `PRIORITY_STYLES`, `STATUS_STYLES`, `PLAN_STYLES` in `src/lib/status-styles.ts` — canonical source for badge colors; use `Badge variant="secondary"` + class override in portal
- Semantic tokens: `success`, `warning`, `info` (and `-foreground` variants), `chart-6` — use via `bg-success/15`, `text-warning`, etc.
- Typography utilities in `globals.css`: `.text-page-title`, `.text-section-title`, `.text-card-label`, `.text-card-value`, `.text-table`, `.text-caption`

## Server/Client Split

- Do NOT add `'use client'` to components currently server-rendered
- Page pattern: server component role-guards via `getUserContext()` + `redirect()`, then renders a client component that owns all interactivity
- Portal layout (`src/app/portal/layout.tsx`) — server component; only does the `team_member` role-guard redirect; sidebar handles email display
- Both layouts use `flex h-screen` with `<Sidebar />` + `<main className="flex-1 overflow-y-auto">`

## Specific Components

- `TeamPerformanceTable` — TanStack Table with client-side sort + filter; `numberRangeFilter` FilterFn needs `!Array.isArray(val)` guard in `autoRemove` (TanStack calls it with `undefined` when clearing)
- `ClientAnalysisTable` — local state for search/page/sort (no URL sync); `keepPreviousData` eliminates skeleton flash; `isFetching && !isLoading` drives opacity fade
- `getDashboardAllWithComparison` — computes previous period via `computePreviousFilters` (shifts `range` by same duration, `exact` by 1 day; returns `null` for unbounded operators)
- `get_dashboard_summary_rls` counts `status IN ('open', 'in_progress')` for `open_tickets` — not just `open`
- `ResolutionHistogramChart` — Recharts stacked BarChart; Fine/Standard/Coarse granularity toggle; fine bins returned by backend, merged client-side for Standard/Coarse
- `OverdueTicketsTable` receives data as props — query and page state owned by `ResponseTimeContent`
- Portal `createTicket` inserts ticket + first message in the same `withRLS` transaction; `clientId` always from session context, never user input

## Playwright / Visual Regression

- `@playwright/test` installed; Chromium browser required (`npx playwright install chromium`)
- Auth saved via storageState: `e2e/.auth/team-member.json` (john@company.com) and `e2e/.auth/client.json` (admin@techstart.com)
- `npm run test:e2e` — compare against baselines; `npm run test:e2e:update` — write/overwrite baselines
- First run always "fails" with "snapshot doesn't exist" — this is expected; run `--update-snapshots` to create baselines
- Baselines stored in `e2e/visual-baselines.spec.ts-snapshots/` and committed to repo
