import { KpiCard } from '@/components/dashboard/KpiCard';
import { formatCompact, formatCurrency } from '@/lib/format';
import { getClientAnalysisSummary } from '@/lib/queries/clients';

export async function ClientsSummarySectionServer() {
  const summary = await getClientAnalysisSummary();
  const activePct =
    summary.totalClients > 0
      ? `${((summary.activeClients / summary.totalClients) * 100).toFixed(1)}% active`
      : '0% active';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="TOTAL CLIENTS"
        value={formatCompact(summary.totalClients)}
        subtitle={activePct}
      />
      <KpiCard
        label="ACTIVE CLIENTS"
        value={formatCompact(summary.activeClients)}
        subtitle="Visible to the current role"
        delay={0.05}
      />
      <KpiCard
        label="OPEN TICKETS"
        value={formatCompact(summary.openTickets)}
        subtitle="Across the full client portfolio"
        delay={0.1}
      />
      <KpiCard
        label="PAID REVENUE"
        value={formatCurrency(summary.totalRevenue)}
        subtitle="Settled payments only"
        delay={0.15}
      />
    </div>
  );
}
