# OpsKings Dashboard

## Project Context

Support analytics dashboard. Next.js 16 (App Router), TypeScript, Drizzle ORM,
Supabase (PostgreSQL), BetterAuth, TanStack Query, Recharts, shadcn/ui, Tailwind CSS v4.

~40k tickets, 50 clients, 15 team members, 14 ticket types.
Two roles: `team_member` (full dashboard) and `client` (portal, own data only).

## Critical Rules

- ALL user-facing queries MUST use `withRLS(ctx, fn)` from `src/lib/db/rls-client.ts` — never bare `db` or `adminDb`
- postgres.js clients MUST set `prepare: false` — Transaction Pooler doesn't support prepared statements
- Recharts SVG `fill`/`stroke` does NOT support `oklch()` — use `useChartTheme()` from `src/hooks/use-chart-theme.ts` for all chart colors
- Recharts tooltip `contentStyle.background` must be a hex literal — CSS variables don't resolve in Recharts' out-of-tree tooltip DOM
- `PRIORITY_STYLES`, `STATUS_STYLES`, `PLAN_STYLES` in `src/lib/status-styles.ts` are the canonical source for badge colors — never create local maps
- Each page must use a single combined server action + single `useQuery` — Next.js serializes concurrent server action calls, causing waterfalls
- `drizzle-kit push` fails on this Supabase instance (CHECK constraint bug) — use `drizzle-kit migrate` with hand-crafted migrations or direct SQL
- Middleware fetches session via self-fetch to `/api/auth/get-session` — postgres.js cannot run in Edge Runtime, don't import auth server directly in middleware
- Do NOT pass Lucide icon components as props from server components to client components — they contain methods and can't be serialized

## Shared Utilities

- `src/lib/format.ts` — `formatCompact`, `formatHours`, `formatPercent`, `formatDate`, `formatUsername`
- `src/lib/status-styles.ts` — `PRIORITY_STYLES`, `STATUS_STYLES`, `PLAN_STYLES`
- `src/hooks/use-chart-theme.ts` — `useChartTheme()`, `chartPalette()`, `priorityColor()`
- `src/components/charts/ChartTooltip.tsx` — `tooltipStyle(colors)`
- `src/components/charts/ChartTabs.tsx` — reusable segmented control
- `src/lib/queries/filters.ts` — `applyTicketFilters()`
- `src/hooks/use-filter-state.ts` — `useFilterState()` (syncs filters to URL params, wrap consumer in `<Suspense>`)

Full architecture reference: `docs/architecture-decisions.md`

## Completion Protocol

When I type exactly **COMPLETED**:
1. Write a short summary to `docs/implementation-log.md` (append, don't overwrite) — what changed, files touched, gotchas
2. Commit and push with a concise message

Only the exact standalone input **COMPLETED** triggers this.
