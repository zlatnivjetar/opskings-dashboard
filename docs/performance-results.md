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

## E2E Results (Browser Network Tab)

Measured via Chrome DevTools → Network tab on a local dev server (`npm run dev`).
Times are full round-trips including Next.js server action overhead, serialisation,
and local loopback latency.

For pages that originally fired two sequential requests, the **higher value** is
used as the baseline since it was the bottleneck (the second request could not
start until the first completed).

### Page Load

| Page | Request(s) | Time | Notes |
|------|-----------|------|-------|
| `/dashboard` | 1 (was 2 sequential) | ~210 ms | getDashboardAll |
| `/dashboard/team` | 1 | ~441 ms | getTeamPerformance |
| `/dashboard/distribution` | 1 (was 2 sequential) | ~418 ms | getDistributionAll |
| `/dashboard/clients` | 1 | ~199 ms | getClientAnalysis |
| `/dashboard/response-time` | 1 (was 2 sequential) | ~319 ms | getResponseTimeAll |

### Interactions

| Page / Action | Time | Notes |
|--------------|------|-------|
| Dashboard — apply filter | ~161 ms | |
| Dashboard — remove filter | ~43 ms | Next.js RSC navigation payload, no data fetch |
| Distribution — apply filter | ~392 ms | (higher of ~384 ms / ~392 ms) |
| Distribution — remove filter | ~34 ms | RSC navigation payload |
| Client analysis — search (debounced) | ~174 ms | 300 ms debounce before request fires |
| Client analysis — sort column | ~185 ms | |
| Client analysis — page navigation | ~178 ms | |
| Response time — page navigation | ~284 ms | stats + overdue refetch together |
| Response time — apply date filter | ~146 ms | (lower of ~146 ms / ~143 ms pair) |

### Sequential → Single Request Fix

E2E testing revealed that Next.js serialises concurrent server action calls from
the same page — the second POST waits for the first to complete. Three pages were
affected:

| Page | Before (2 sequential) | After (1 combined) | Saving |
|------|----------------------|-------------------|--------|
| Dashboard | ~210 ms + ~187 ms | ~210 ms | ~187 ms |
| Distribution | ~418 ms + ~392 ms | ~418 ms | ~392 ms |
| Response Time | ~319 ms + ~260 ms | ~319 ms | ~260 ms |

Fix: collapsed each pair into a single server action using `Promise.all` for
server-side parallelism — one HTTP round-trip, both DB queries run concurrently.

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
