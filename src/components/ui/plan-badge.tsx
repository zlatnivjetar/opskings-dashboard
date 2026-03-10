import { Badge } from '@/components/ui/badge';
import { PLAN_STYLES } from '@/lib/status-styles';

export function PlanBadge({ plan }: { plan: string }) {
  const style = PLAN_STYLES[plan];
  const label = style?.label ?? plan;
  const dot = style?.dot ?? 'bg-muted-foreground';
  return (
    <Badge variant="outline" className="bg-gray-50 text-black dark:bg-gray-800 dark:text-white">
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
      {label}
    </Badge>
  );
}
