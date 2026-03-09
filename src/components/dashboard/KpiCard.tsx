import { Card } from '@/components/ui/card';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;   // percentage, positive = increased
    label: string;   // e.g. "vs prev period"
  };
  /** When true, a positive trend is shown in success color. Default: true. */
  positiveIsGood?: boolean;
}

export function KpiCard({ label, value, subtitle, trend, positiveIsGood = true }: KpiCardProps) {
  const isPositive = trend != null && trend.value >= 0;
  const isGood = trend != null && (positiveIsGood ? isPositive : !isPositive);

  return (
    <Card className="p-4">
      <p className="text-card-label">{label}</p>
      <p className="text-card-value mt-1">{value}</p>
      {trend != null && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs font-medium ${
            isGood ? 'text-success' : 'text-destructive'
          }`}
        >
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>
            {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </span>
        </div>
      )}
      {subtitle && <p className="text-caption mt-1">{subtitle}</p>}
    </Card>
  );
}
