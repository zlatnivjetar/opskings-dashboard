import { Badge } from '@/components/ui/badge';
import { STATUS_STYLES } from '@/lib/status-styles';

export function StatusBadge({ status }: { status: string }) {
  const label = status === 'in_progress' ? 'in progress' : status;
  return (
    <Badge variant="outline" className="bg-gray-50 text-black dark:bg-gray-800 dark:text-white">
      <span className={`size-1.5 shrink-0 rounded-full ${STATUS_STYLES[status] ?? 'bg-muted-foreground'}`} />
      {label}
    </Badge>
  );
}
