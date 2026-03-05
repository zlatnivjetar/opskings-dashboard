# Performance Results — Milestone 11

Measured from the benchmark script (`scripts/benchmark.ts`) connecting to the
Supabase Transaction Pooler on AWS eu-west-1 from a Windows 11 dev machine.
Times are wall-clock (3 runs, average), including network round-trip (~100–150 ms
base latency). Query execution times alone are lower.

## Results Table

| Query | Unfiltered | Filtered (date + team) | Target |
|-------|-----------|----------------------|--------|
| Dashboard summary | 156 ms ✅ | 107 ms ✅ | < 500 ms |
| Tickets over time | 137 ms ✅ | 105 ms ✅ | < 800 ms |
| Team performance | 384 ms ✅ | N/A | < 500 ms |
| Tickets by type | 343 ms ✅ | 360 ms ✅ | < 800 ms |
| Tickets by priority | 350 ms ✅ | 355 ms ✅ | < 800 ms |
| Client analysis (page 1) | 135 ms ✅ | 132 ms ✅ | < 300 ms |
| Resolution time stats | 205 ms ✅ | 104 ms ✅ | < 500 ms |
| Overdue tickets (page 1) | 227 ms ✅ | 104 ms ✅ | < 300 ms |

All queries meet their performance targets. ✅

## Optimization Applied

**Client analysis** was the only query that initially exceeded its target (348 ms avg).
EXPLAIN ANALYZE revealed a cross-join problem:

```
Nested Loop Left Join ... rows=283,940 loops=1
  Nested Loop Left Join ... rows=234 loops=1
    Index Scan on clients c ... rows=50
    Index Scan on payments p ... rows=5 per client → 234 total
  Index Scan on tickets t ... rows=1,213 per pair → 283,940 total rows
```

The original query joined both `tickets` and `payments` directly to `clients`,
creating a cross-product of `n_payments × n_tickets` rows per client before
GROUP BY. This also caused data accuracy issues: `total_tickets` was being
multiplied by the number of payments, and `total_spent` by the number of tickets.

**Fix:** Rewrote `get_client_analysis_rls()` to pre-aggregate each table in
separate CTEs before joining:

- `ticket_stats` CTE: aggregate tickets → 50 rows (one per client)
- `payment_stats` CTE: aggregate payments → 50 rows (one per client)
- Final join: 50 × 50 rows, not 283,940

Result: 348 ms → 135 ms (2.6× speedup). Also removed dynamic SQL (`EXECUTE
FORMAT`) in favour of static SQL with `CASE`-based ORDER BY, enabling plan
caching. Replaced function deployed to Supabase.

## E2E Results — Production (Vercel)

Measured via Chrome DevTools → Network tab on the deployed Vercel instance.
Times are full round-trips including browser→Vercel serverless (~100-150 ms) +
Vercel→Supabase (~100-150 ms) network latency. Raw query times are ~150-200 ms
lower (see benchmark results above).

### Page Load

| Page | Time | Notes |
|------|------|-------|
| `/dashboard` | ~357 ms | getDashboardAll (combined summary + chart) |
| `/dashboard/team` | ~671 ms | getTeamPerformance (LEFT JOIN chain) |
| `/dashboard/distribution` | ~637 ms | getDistributionAll (combined type + priority) |
| `/dashboard/clients` | ~347 ms | getClientAnalysis (CTE optimization) |
| `/dashboard/response-time` | ~449 ms | getResponseTimeAll (combined stats + overdue) |

### Interactions

| Page / Action | Time |
|--------------|------|
| Dashboard — apply filter | ~383 ms |
| Distribution — apply filter | ~664 ms |
| Client analysis — sort column | ~390 ms |
| Response time — apply filter | ~453 ms |

### Optimizations Applied

1. **Sequential → single request** — Three pages originally fired two sequential
   server action calls (Next.js serialises concurrent calls per page). Combined
   each pair into a single action with `Promise.all` for server-side parallelism.

2. **Middleware bypass for server actions** — Server actions verify auth internally
   via `getUserContext()`. The middleware's self-fetch to `/api/auth/get-session`
   was redundant and added ~100-200 ms per call. Requests with the `Next-Action`
   header now skip the session check.

3. **Combined reference data** — FilterBar's two separate reference data calls
   (`getTeamMembers` + `getTicketTypes`) merged into one `getReferenceData()`
   action, eliminating one serialised round-trip on cold loads.

4. **Disabled link prefetching** — Sidebar and auth page `<Link>` components had
   `prefetch` enabled by default, firing 5-10 simultaneous RSC fetches on every
   page load. Disabled with `prefetch={false}`.

5. **Native history API for filters** — Replaced `router.replace()` with
   `window.history.replaceState()` for URL-synced filters. Next.js still picks up
   the URL change for `useSearchParams()` but no longer triggers redundant RSC
   soft-navigation refetches.

---

## Architecture Notes

### No N+1 Queries

All queries fetch data in a single round-trip:
- Dashboard summary, tickets over time, client analysis, resolution time stats,
  overdue tickets: stored functions via `adminDb.execute()` (one round-trip each)
- Team performance, tickets by type/priority: Drizzle ORM queries inside a
  `withRLS()` transaction (one query each after the 2-statement RLS setup)

### Parallel Data Fetching

Each page that needs multiple data sets uses a single combined server action with
`Promise.all` for server-side parallelism and a single `useQuery` on the client:

- `getDashboardAll` — summary + ticketsOverTime
- `getDistributionAll` — byType + byPriority
- `getResponseTimeAll(filters, page)` — stats + overdue tickets

### TanStack Query Caching

- Dashboard data: `staleTime: 30_000` (30 s) — applies filter, remove filter → second
  load is instant from cache within the same session.
- Reference data (team members, ticket types for FilterBar): `staleTime: 300_000`
  (5 min).

### Loading States

Every data-fetching component shows a skeleton during `isLoading`:

| Component | Skeleton |
|-----------|---------|
| `DashboardContent` | 4-card skeleton grid + `h-[300px]` chart skeleton |
| `TeamPerformanceTable` | 8 skeleton rows in the table |
| `TicketsByTypeChart` | `h-[340px]` skeleton |
| `TicketsByPriorityChart` | `h-[340px]` skeleton |
| `ClientAnalysisTable` | 10 skeleton rows + `keepPreviousData` opacity fade |
| `ResponseTimeContent` | `h-[180px]` stats skeleton + `h-[280px]` chart skeleton |
| `OverdueTicketsTable` | 10 × 8 skeleton cells + `keepPreviousData` opacity fade |

### Existing Indexes (Milestone 1)

All joins in the query plans used index scans — no sequential scans on large tables:

| Index | Covers |
|-------|--------|
| `idx_tickets_type_created` | (ticket_type_id, created_at) — type distribution + date filter |
| `idx_tickets_assigned_status` | (assigned_to, status) — team filter + status |
| `idx_tickets_priority_status` | (priority, status) — priority distribution |
| `idx_tickets_client_created` | (client_id, created_at) — client filter + date range |
| `idx_tickets_created_status` | (created_at, status) — date filter |
| `idx_payments_client_status` | (client_id, status) — payments per client |
| `idx_tickets_client_id` | (client_id) — standalone, used by client analysis CTEs |
