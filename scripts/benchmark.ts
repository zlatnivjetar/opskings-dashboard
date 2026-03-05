/**
 * Performance benchmark for all major dashboard queries.
 * Run with: npx tsx scripts/benchmark.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const db = postgres(process.env.DATABASE_URL!, { prepare: false });

interface TimingResult {
  times: number[];
  avg: number;
  min: number;
}

async function timeQuery(fn: () => Promise<unknown>, runs = 3): Promise<TimingResult> {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    await fn();
    times.push(Date.now() - start);
  }
  return {
    times,
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
    min: Math.min(...times),
  };
}

interface BenchEntry {
  label: string;
  target: number;
  unfiltered: TimingResult;
  filtered: TimingResult | null; // null = same as unfiltered (no filter variant)
}

const results: BenchEntry[] = [];

// ─── RLS setup helper (for withRLS-style queries) ────────────────────────────

async function withRLS<T>(
  ctx: { userId: string; role: string; clientId: string; teamMemberId: string },
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return db.begin(async (tx) => {
    await tx`SET LOCAL ROLE rls_user`;
    await tx`
      SELECT
        set_config('app.user_id',        ${ctx.userId},        true),
        set_config('app.user_role',       ${ctx.role},          true),
        set_config('app.client_id',       ${ctx.clientId},      true),
        set_config('app.team_member_id',  ${ctx.teamMemberId},  true)
    `;
    return fn(tx);
  }) as Promise<T>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('OpsKings Dashboard — Performance Benchmark');
  console.log('===========================================\n');

  // Get a valid team_member user context
  const [user] = await db`
    SELECT id, team_member_id FROM "user" WHERE email = 'john@company.com'
  `;
  if (!user) throw new Error('john@company.com not found — run npm run seed:auth first');

  const ctx = {
    userId: String(user.id),
    role: 'team_member',
    clientId: '',
    teamMemberId: String(user.team_member_id),
  };

  console.log(`Context: userId=${ctx.userId.slice(0, 8)}..., teamMemberId=${ctx.teamMemberId}`);
  console.log('Running 3 iterations per query (unfiltered + filtered)...\n');

  // Date+team filter params
  const dateFrom = '2024-01-01T00:00:00.000Z';
  const dateTo   = '2024-12-31T23:59:59.999Z';
  const teamIncl = '{1}'; // John Smith

  // ── 1. Dashboard summary ─────────────────────────────────────────────────

  process.stdout.write('1/8  Dashboard summary... ');
  const ds_unf = await timeQuery(() =>
    db`SELECT * FROM get_dashboard_summary_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      NULL::timestamptz, NULL::timestamptz,
      NULL::int[], NULL::int[], NULL::int[], NULL::int[], NULL::text[], NULL::text[]
    )`,
  );
  const ds_flt = await timeQuery(() =>
    db`SELECT * FROM get_dashboard_summary_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      ${dateFrom}::timestamptz, ${dateTo}::timestamptz,
      ${teamIncl}::int[], NULL::int[], NULL::int[], NULL::int[], NULL::text[], NULL::text[]
    )`,
  );
  results.push({ label: 'Dashboard summary', target: 500, unfiltered: ds_unf, filtered: ds_flt });
  console.log(`unf=${ds_unf.avg}ms flt=${ds_flt.avg}ms`);

  // ── 2. Tickets over time ─────────────────────────────────────────────────

  process.stdout.write('2/8  Tickets over time... ');
  const tot_unf = await timeQuery(() =>
    db`SELECT * FROM get_tickets_over_time_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      NULL::timestamptz, NULL::timestamptz,
      NULL::int[], NULL::int[], NULL::int[], NULL::int[], NULL::text[], NULL::text[]
    )`,
  );
  const tot_flt = await timeQuery(() =>
    db`SELECT * FROM get_tickets_over_time_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      ${dateFrom}::timestamptz, ${dateTo}::timestamptz,
      ${teamIncl}::int[], NULL::int[], NULL::int[], NULL::int[], NULL::text[], NULL::text[]
    )`,
  );
  results.push({ label: 'Tickets over time', target: 800, unfiltered: tot_unf, filtered: tot_flt });
  console.log(`unf=${tot_unf.avg}ms flt=${tot_flt.avg}ms`);

  // ── 3. Team performance ──────────────────────────────────────────────────

  process.stdout.write('3/8  Team performance... ');
  const tp_unf = await timeQuery(() =>
    withRLS(ctx, (tx) => tx`
      SELECT
        tm.id, tm.username, tm.department, tm.status,
        COUNT(t.id) AS assigned,
        COUNT(t.id) FILTER (WHERE t.status = 'resolved') AS resolved,
        CASE WHEN COUNT(t.id) > 0
          THEN ROUND(COUNT(t.id) FILTER (WHERE t.status = 'resolved')::numeric / COUNT(t.id) * 100, 1)
          ELSE NULL END AS resolution_rate,
        AVG(EXTRACT(EPOCH FROM (t.resolved_at - t.created_at)) / 3600.0)
          FILTER (WHERE t.resolved_at IS NOT NULL) AS avg_resolution_hours,
        AVG(tf.rating) AS avg_rating
      FROM team_members tm
      LEFT JOIN tickets t ON t.assigned_to = tm.id
      LEFT JOIN ticket_feedback tf ON tf.ticket_id = t.id
      GROUP BY tm.id, tm.username, tm.department, tm.status
      ORDER BY tm.username
    `),
  );
  results.push({ label: 'Team performance', target: 500, unfiltered: tp_unf, filtered: null });
  console.log(`unf=${tp_unf.avg}ms (no filter variant)`);

  // ── 4. Tickets by type ───────────────────────────────────────────────────

  process.stdout.write('4/8  Tickets by type... ');
  const tbt_unf = await timeQuery(() =>
    withRLS(ctx, (tx) => tx`
      SELECT tt.id AS ticket_type_id, tt.type_name, COUNT(*)::int AS count
      FROM tickets t
      INNER JOIN ticket_types tt ON t.ticket_type_id = tt.id
      GROUP BY tt.id, tt.type_name
      ORDER BY COUNT(*) DESC
    `),
  );
  const tbt_flt = await timeQuery(() =>
    withRLS(ctx, (tx) => tx`
      SELECT tt.id AS ticket_type_id, tt.type_name, COUNT(*)::int AS count
      FROM tickets t
      INNER JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE t.created_at >= ${dateFrom}::timestamptz
        AND t.created_at <= ${dateTo}::timestamptz
        AND t.assigned_to = ANY(${[1]}::int[])
      GROUP BY tt.id, tt.type_name
      ORDER BY COUNT(*) DESC
    `),
  );
  results.push({ label: 'Tickets by type', target: 800, unfiltered: tbt_unf, filtered: tbt_flt });
  console.log(`unf=${tbt_unf.avg}ms flt=${tbt_flt.avg}ms`);

  // ── 5. Tickets by priority ───────────────────────────────────────────────

  process.stdout.write('5/8  Tickets by priority... ');
  const tbp_unf = await timeQuery(() =>
    withRLS(ctx, (tx) => tx`
      SELECT t.priority,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int AS open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int AS in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved
      FROM tickets t
      GROUP BY t.priority
      ORDER BY CASE priority
        WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 ELSE 5 END
    `),
  );
  const tbp_flt = await timeQuery(() =>
    withRLS(ctx, (tx) => tx`
      SELECT t.priority,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END)::int AS open,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END)::int AS in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved
      FROM tickets t
      WHERE t.created_at >= ${dateFrom}::timestamptz
        AND t.created_at <= ${dateTo}::timestamptz
        AND t.assigned_to = ANY(${[1]}::int[])
      GROUP BY t.priority
      ORDER BY CASE priority
        WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 ELSE 5 END
    `),
  );
  results.push({ label: 'Tickets by priority', target: 800, unfiltered: tbp_unf, filtered: tbp_flt });
  console.log(`unf=${tbp_unf.avg}ms flt=${tbp_flt.avg}ms`);

  // ── 6. Client analysis (page 1) ──────────────────────────────────────────

  process.stdout.write('6/8  Client analysis (page 1)... ');
  const ca_unf = await timeQuery(() =>
    db`SELECT * FROM get_client_analysis_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      '', 1, 20, 'totalTickets', 'desc'
    )`,
  );
  const ca_flt = await timeQuery(() =>
    db`SELECT * FROM get_client_analysis_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      'Tech', 1, 20, 'totalTickets', 'desc'
    )`,
  );
  results.push({ label: 'Client analysis (page 1)', target: 300, unfiltered: ca_unf, filtered: ca_flt });
  console.log(`unf=${ca_unf.avg}ms flt=${ca_flt.avg}ms`);

  // ── 7. Resolution time stats ─────────────────────────────────────────────

  process.stdout.write('7/8  Resolution time stats... ');
  const rt_unf = await timeQuery(() =>
    db`SELECT * FROM get_resolution_time_stats_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      NULL::timestamptz, NULL::timestamptz, NULL::int[], NULL::int[]
    )`,
  );
  const rt_flt = await timeQuery(() =>
    db`SELECT * FROM get_resolution_time_stats_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      ${dateFrom}::timestamptz, ${dateTo}::timestamptz,
      ${teamIncl}::int[], NULL::int[]
    )`,
  );
  results.push({ label: 'Resolution time stats', target: 500, unfiltered: rt_unf, filtered: rt_flt });
  console.log(`unf=${rt_unf.avg}ms flt=${rt_flt.avg}ms`);

  // ── 8. Overdue tickets (page 1) ──────────────────────────────────────────

  process.stdout.write('8/8  Overdue tickets (page 1)... ');
  const ot_unf = await timeQuery(() =>
    db`SELECT * FROM get_overdue_tickets_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      NULL::timestamptz, NULL::timestamptz, NULL::int[], NULL::int[],
      1, 20
    )`,
  );
  const ot_flt = await timeQuery(() =>
    db`SELECT * FROM get_overdue_tickets_rls(
      ${ctx.userId}, ${ctx.role}, ${ctx.clientId}, ${ctx.teamMemberId},
      ${dateFrom}::timestamptz, ${dateTo}::timestamptz,
      ${teamIncl}::int[], NULL::int[],
      1, 20
    )`,
  );
  results.push({ label: 'Overdue tickets (page 1)', target: 300, unfiltered: ot_unf, filtered: ot_flt });
  console.log(`unf=${ot_unf.avg}ms flt=${ot_flt.avg}ms`);

  // ─── Summary table ─────────────────────────────────────────────────────────

  console.log('\n\n=== RESULTS ===\n');
  console.log(
    '| Query                    | Unfiltered | Filtered (date+team) | Target  |',
  );
  console.log(
    '|--------------------------|------------|----------------------|---------|',
  );

  let allPass = true;
  for (const r of results) {
    const unfTag = r.unfiltered.avg <= r.target ? '✅' : '❌';
    const fltTag = r.filtered
      ? r.filtered.avg <= r.target
        ? '✅'
        : '❌'
      : 'N/A';
    const unf = `${r.unfiltered.avg}ms ${unfTag}`;
    const flt = r.filtered ? `${r.filtered.avg}ms ${fltTag}` : 'N/A';
    if (r.unfiltered.avg > r.target || (r.filtered && r.filtered.avg > r.target)) allPass = false;
    console.log(
      `| ${r.label.padEnd(24)} | ${unf.padEnd(10)} | ${flt.padEnd(20)} | <${r.target}ms |`,
    );
  }

  console.log(`\n${allPass ? '✅ All queries meet performance targets.' : '⚠️  Some queries exceed targets — review EXPLAIN ANALYZE.'}`);

  // ─── Raw timing data ───────────────────────────────────────────────────────

  console.log('\n=== Raw Timings (ms) ===\n');
  for (const r of results) {
    const unfRaw = r.unfiltered.times.join('/');
    const fltRaw = r.filtered ? r.filtered.times.join('/') : 'N/A';
    console.log(`  ${r.label}`);
    console.log(`    Unfiltered: [${unfRaw}] → min=${r.unfiltered.min}ms avg=${r.unfiltered.avg}ms`);
    console.log(`    Filtered:   [${fltRaw}]${r.filtered ? ` → min=${r.filtered.min}ms avg=${r.filtered.avg}ms` : ''}`);
  }

  await db.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
